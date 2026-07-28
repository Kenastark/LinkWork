import { useEffect, useState } from 'react';
import { api } from './api.js';
import { useI18n } from './i18n.jsx';

// Translates dynamic DB content (job descriptions, company blurbs, etc.) via the
// server's /api/translate route. Renders the original text immediately, then swaps
// in the translated version once it resolves — never blocks or errors the page.
export function useTranslatedTexts(texts) {
  const { lang } = useI18n();
  const [translated, setTranslated] = useState(texts);
  const key = JSON.stringify(texts);

  useEffect(() => {
    if (lang === 'en') { setTranslated(texts); return; }
    let cancelled = false;
    api.post('/api/translate', { texts, lang })
      .then(d => { if (!cancelled) setTranslated(d.texts); })
      .catch(() => { if (!cancelled) setTranslated(texts); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, key]);

  return translated;
}
