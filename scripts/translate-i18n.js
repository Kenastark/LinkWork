#!/usr/bin/env node
// One-off authoring script: machine-translates client/src/i18n.jsx's `translations.en`
// into hu/fr, layering hand-written overrides on top, and writes the result to
// client/src/locales/ — the real source of truth i18n.jsx imports at build time.
// Not imported by the app or by server/ — safe to change without a build.

const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });

const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
if (!API_KEY) {
  console.error('[translate-i18n] GOOGLE_TRANSLATE_API_KEY is not set (checked server/.env). Refusing to run.');
  process.exit(1);
}

const REPO_ROOT = path.join(__dirname, '..');
const I18N_PATH = path.join(REPO_ROOT, 'client', 'src', 'i18n.jsx');
const OVERRIDES_PATH = path.join(__dirname, 'i18n-overrides.json');
const NO_MT_PATH = path.join(__dirname, 'i18n-no-mt.json');
const OUTPUT_DIR = path.join(REPO_ROOT, 'client', 'src', 'locales');
const TARGET_LANGS = ['hu', 'fr'];

// Values are simple, single-line `key`: `value` template literals with no
// ${...} interpolation (verified against the current file), so a line-based
// regex is enough — no need to pull in a JS/JSX parser for a throwaway script.
function extractSection(source, sectionName) {
  const sectionRe = new RegExp(`^  ${sectionName}: \\{$`, 'm');
  const startMatch = sectionRe.exec(source);
  if (!startMatch) throw new Error(`Could not find translations.${sectionName} in ${I18N_PATH}`);
  const bodyStart = startMatch.index + startMatch[0].length;
  const bodyEnd = source.indexOf('\n  },', bodyStart);
  if (bodyEnd === -1) throw new Error(`Could not find end of translations.${sectionName} in ${I18N_PATH}`);
  const body = source.slice(bodyStart, bodyEnd);

  const entryRe = /^\s*'([^']+)':\s*`(.*)`,\s*$/gm;
  const entries = {};
  let match;
  while ((match = entryRe.exec(body))) {
    const [, key, rawValue] = match;
    entries[key] = rawValue.replace(/\\(.)/g, (_, c) => ({ n: '\n', t: '\t', r: '\r' }[c] ?? c));
  }
  return entries;
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2) + '\n');
    return fallback;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Google's v2 endpoint rejects requests over 128 text segments, and this script
// translates ~180 keys per language, so a true single call isn't possible —
// chunk just enough to stay under that cap rather than falling back to one
// call per key.
const MAX_SEGMENTS_PER_REQUEST = 100;

// i18n.jsx's t(key, vars) fills `{varName}` placeholders at render time. Sent as-is,
// Google Translate treats them as ordinary words — it has been seen both translating
// the name (`{state}` -> `{état}`) and reordering distinct placeholders inconsistently
// per language. Swapping each to a digit-only `{0}`, `{1}`... before the request and
// restoring the real names by position afterward keeps every placeholder intact.
function indexPlaceholders(text) {
  let i = -1;
  return text.replace(/\{(\w+)\}/g, () => `{${++i}}`);
}

function restorePlaceholders(text, varNames) {
  return text.replace(/\{(\d+)\}/g, (m, idx) => {
    const name = varNames[Number(idx)];
    return name === undefined ? m : `{${name}}`;
  });
}

async function translateChunk(texts, targetLang) {
  const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: texts, target: targetLang, source: 'en', format: 'text' }),
  });
  if (!res.ok) {
    throw new Error(`Google Translate API request failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  }
  const data = await res.json();
  return (data?.data?.translations || []).map((t) => t.translatedText);
}

async function translateBatch(texts, targetLang) {
  if (texts.length === 0) return [];
  const results = [];
  for (let i = 0; i < texts.length; i += MAX_SEGMENTS_PER_REQUEST) {
    const chunk = texts.slice(i, i + MAX_SEGMENTS_PER_REQUEST);
    results.push(...(await translateChunk(chunk, targetLang)));
  }
  return results;
}

async function main() {
  const source = fs.readFileSync(I18N_PATH, 'utf8');
  const en = extractSection(source, 'en');
  const enKeys = Object.keys(en);

  const overrides = readJson(OVERRIDES_PATH, { hu: {}, fr: {} });
  const noMt = new Set(readJson(NO_MT_PATH, []));

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const lang of TARGET_LANGS) {
    const langOverrides = overrides[lang] || {};
    const keysToTranslate = enKeys.filter((k) => !(k in langOverrides) && !noMt.has(k));

    const varNamesByKey = keysToTranslate.map((k) => [...en[k].matchAll(/\{(\w+)\}/g)].map((m) => m[1]));
    const rawTranslated = await translateBatch(keysToTranslate.map((k) => indexPlaceholders(en[k])), lang);
    const translated = rawTranslated.map((text, i) => restorePlaceholders(text, varNamesByKey[i]));

    const result = {};
    enKeys.forEach((k) => {
      if (noMt.has(k) && !(k in langOverrides)) {
        result[k] = en[k];
      }
    });
    keysToTranslate.forEach((k, i) => { result[k] = translated[i]; });
    Object.assign(result, langOverrides);

    const outPath = path.join(OUTPUT_DIR, `${lang}.json`);
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2) + '\n');
    console.log(`[translate-i18n] wrote ${outPath} (${keysToTranslate.length} machine-translated, ${Object.keys(langOverrides).length} overridden, ${noMt.size} no-mt)`);
  }
}

main().catch((err) => {
  console.error('[translate-i18n]', err.message);
  process.exit(1);
});
