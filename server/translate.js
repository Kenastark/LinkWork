require('dotenv').config();
const crypto = require('crypto');
const db = require('./db');

const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
const FEATURE_ENABLED = !!API_KEY;

const hash = (text) => crypto.createHash('sha256').update(text).digest('hex');

const getCached = db.prepare('SELECT translated_text FROM translation_cache WHERE text_hash=? AND target_lang=?');
const insertCache = db.prepare(`
  INSERT INTO translation_cache (text_hash, target_lang, source_text, translated_text) VALUES (?,?,?,?)
  ON CONFLICT(text_hash, target_lang) DO UPDATE SET translated_text=excluded.translated_text
`);

// Translates a batch of strings to targetLang, using the DB as a cache so repeat
// views of the same job/company text don't re-call (or re-pay for) the API.
async function translateBatch(texts, targetLang) {
  if (!FEATURE_ENABLED || targetLang === 'en') return texts;

  const results = new Array(texts.length);
  const toFetch = [];
  texts.forEach((text, i) => {
    if (!text) { results[i] = text; return; }
    const cached = getCached.get(hash(text), targetLang);
    if (cached) results[i] = cached.translated_text;
    else toFetch.push({ index: i, text });
  });
  if (toFetch.length === 0) return results;

  const res = await fetch(`https://translation.googleapis.com/language/translate2?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: toFetch.map(f => f.text), target: targetLang, source: 'en', format: 'text' }),
  });

  if (!res.ok) {
    // Graceful fallback — never break a page over a translation-provider hiccup.
    toFetch.forEach(({ index, text }) => { results[index] = text; });
    return results;
  }

  const data = await res.json();
  const translations = data?.data?.translations || [];
  toFetch.forEach(({ index, text }, i) => {
    const translated = translations[i]?.translatedText ?? text;
    results[index] = translated;
    insertCache.run(hash(text), targetLang, text, translated);
  });
  return results;
}

module.exports = { translateBatch, FEATURE_ENABLED };
