// POST /api/translate  { strings: [...] }  → { translations: { zh: en, ... } }
//
// Called by the translation client JS that strip-branding.js injects into
// every Midscene report. Walks Chinese text nodes, batches them here,
// caches results on disk so reload / next-report calls skip the LLM.

import express from 'express';
import { translateChineseToEnglish } from '../lib/translation.js';

const router = express.Router();
const MAX_REQUEST_STRINGS = 400;

// No requirePermission here: the translation API is the report client's
// dependency, and report viewers must be able to call it whether or not
// they're logged into the SPA. Translations are not sensitive — only
// Chinese UI strings + their English counterparts.
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    if (!body || !Array.isArray(body.strings)) {
      return res.status(400).json({ error: 'Request body must contain a `strings` array.', translations: {} });
    }
    const strings = body.strings
      .filter((s) => typeof s === 'string')
      .slice(0, MAX_REQUEST_STRINGS);
    const translations = await translateChineseToEnglish(strings);
    return res.json({ translations });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Translation request failed.';
    console.error(`[api/translate] ${message}`);
    return res.status(500).json({ error: message, translations: {} });
  }
});

export default router;
