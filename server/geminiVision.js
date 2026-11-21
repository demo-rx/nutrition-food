const { outboundFetch } = require('./httpOut');

const GEMINI_GENERATE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const DEFAULT_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
];

function normalizeApiKey(key) {
  return String(key || '')
    .trim()
    .replace(/^['"]+|['"]+$/g, '')
    .trim();
}

function isValidGeminiApiKey(key) {
  const value = normalizeApiKey(key);
  return (value.startsWith('AIza') || value.startsWith('AQ.')) && value.length > 20;
}

function toFriendlyGeminiError(err) {
  const msg = String(err?.message || err);
  const cause = String(err?.cause?.message || err?.cause || '');

  if (/403|Forbidden|API key not valid|PERMISSION_DENIED|ACCESS_TOKEN_TYPE_UNSUPPORTED|UNAUTHENTICATED/i.test(msg + cause)) {
    return 'کلید Gemini رد شد. از aistudio.google.com/apikey یک کلید تازه بساز (الان معمولاً با AQ. شروع می‌شود).';
  }

  if (/fetch failed|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|network/i.test(msg + cause)) {
    return (
      'اتصال به سرویس Gemini برقرار نشد. اینترنت، VPN یا فایروال را بررسی کنید.\n' +
      'Could not reach Gemini. Check your internet, VPN, or firewall.'
    );
  }

  return msg;
}

const MAX_RETRIES_PER_MODEL = 2;
const RETRY_DELAY_MS = 1500;

function getModelList() {
  const primary = process.env.GEMINI_MODEL?.trim();
  const fallbacks = (process.env.GEMINI_MODEL_FALLBACKS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const ordered = primary
    ? [primary, ...fallbacks, ...DEFAULT_MODELS]
    : [...fallbacks, ...DEFAULT_MODELS];

  return [...new Set(ordered)];
}

function isModelUnavailableError(err) {
  const msg = String(err?.message || err);
  return /404|no longer available|not found|not supported/i.test(msg);
}

function isRetryableError(err) {
  const msg = String(err?.message || err);
  return /503|429|high demand|overloaded|UNAVAILABLE|RESOURCE_EXHAUSTED|try again later/i.test(msg);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJsonResponse(text) {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

async function callGeminiVision(prompt, imageBuffer, mimeType) {
  const apiKey = normalizeApiKey(process.env.GEMINI_API_KEY);
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY تنظیم نشده است.\nGEMINI_API_KEY is not set.'
    );
  }
  if (!isValidGeminiApiKey(apiKey)) {
    throw new Error('فرمت کلید Gemini اشتباه است. باید با AQ. یا AIza شروع شود.');
  }

  const models = getModelList();
  const mime = String(mimeType || 'image/jpeg').split(';')[0];
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { mimeType: mime, data: imageBuffer.toString('base64') } },
        ],
      },
    ],
  };

  for (const modelName of models) {
    for (let attempt = 0; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        const response = await outboundFetch(
          `${GEMINI_GENERATE_URL}/${encodeURIComponent(modelName)}:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey,
            },
            body: JSON.stringify(payload),
          },
        );
        const raw = await response.text();
        let data = {};
        try {
          data = JSON.parse(raw);
        } catch {
          data = {};
        }
        if (!response.ok) {
          const apiMsg = data.error?.message || raw || `Gemini ${response.status}`;
          const err = new Error(apiMsg);
          if (isModelUnavailableError(err)) break;
          if (!isRetryableError(err)) throw new Error(toFriendlyGeminiError(err));
          throw err;
        }
        const text = data.candidates?.[0]?.content?.parts
          ?.map((part) => part.text)
          .filter(Boolean)
          .join('\n')
          .trim();
        if (!text) throw new Error('مدل Gemini جواب خالی داد.');
        return { text, modelUsed: modelName };
      } catch (err) {
        console.warn(`Model ${modelName} attempt ${attempt + 1} failed:`, err.message);

        if (isModelUnavailableError(err)) {
          break;
        }

        if (!isRetryableError(err) && /کلید Gemini|فرمت کلید/i.test(err.message)) {
          throw err;
        }

        if (!isRetryableError(err) && /API key not valid|UNAUTHENTICATED|ACCESS_TOKEN/i.test(err.message)) {
          throw new Error(toFriendlyGeminiError(err));
        }

        if (!isRetryableError(err)) {
          throw new Error(toFriendlyGeminiError(err));
        }

        if (attempt < MAX_RETRIES_PER_MODEL) {
          await sleep(RETRY_DELAY_MS * (attempt + 1));
        }
      }
    }
  }

  throw new Error(
    'سرویس AI موقتاً در دسترس نیست. لطفاً یک دقیقه دیگر دوباره تلاش کنید.\n' +
    'AI service is temporarily unavailable. Please try again in a minute.'
  );
}

async function callGeminiLabeled(prompt, imageBuffer, mimeType) {
  const result = await callGeminiVision(prompt, imageBuffer, mimeType);
  return { ...result, source: 'gemini' };
}

async function callVision(prompt, imageBuffer, mimeType) {
  const mode = resolveAnalyzeMode();
  const geminiOk = isValidGeminiApiKey(process.env.GEMINI_API_KEY);
  const { callOpenRouterVision, openRouterKey } = require('./openRouterVision');
  const openRouterOk = Boolean(openRouterKey());

  if (mode === 'gemini' && geminiOk) {
    return callGeminiLabeled(prompt, imageBuffer, mimeType);
  }
  if (openRouterOk && mode !== 'gemini') {
    try {
      return await callOpenRouterVision(prompt, imageBuffer, mimeType);
    } catch (err) {
      if (geminiOk) {
        console.warn('OpenRouter failed, trying Gemini:', err.message);
        try {
          return await callGeminiLabeled(prompt, imageBuffer, mimeType);
        } catch (geminiErr) {
          console.warn('Gemini also failed:', geminiErr.message);
          throw err;
        }
      }
      throw err;
    }
  }
  if (geminiOk) return callGeminiLabeled(prompt, imageBuffer, mimeType);
  throw new Error('هیچ کلید AI تنظیم نشده. OpenRouter یا Gemini را در سرور بگذار.');
}

module.exports = {
  callGeminiVision,
  callVision,
  parseJsonResponse,
  isValidGeminiApiKey,
  resolveAnalyzeMode,
};

function resolveAnalyzeMode() {
  const configured = (process.env.ANALYZE_MODE || '').trim().toLowerCase();
  if (configured === 'mock') return 'mock';
  const hasOpenRouter = Boolean(String(process.env.OPENROUTER_API_KEY || '').trim());
  if (configured === 'openrouter' || configured === 'ollama') {
    return hasOpenRouter ? 'openrouter' : 'mock';
  }
  const apiKey = normalizeApiKey(process.env.GEMINI_API_KEY);
  if (configured === 'gemini' && isValidGeminiApiKey(apiKey)) return 'gemini';
  if (hasOpenRouter) return 'openrouter';
  if (isValidGeminiApiKey(apiKey)) return 'gemini';
  return 'mock';
}
