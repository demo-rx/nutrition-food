(function () {
  const DEFAULT_WORKER = 'https://healthy-nutrition-openrouter.roxanasagha.workers.dev';
  const STATIC_SITE_WORKER = 'nutrition-food.roxanasagha.workers.dev';
  const MODELS = [
    'google/gemma-4-31b-it:free',
    'nvidia/nemotron-3.5-super-vl:free',
    'google/gemma-4-26b-a4b-it:free',
  ];

  const PHRASES = [
    [/french\s*fries|fries|tater\s*tots?/i, 'سیب‌زمینی سرخ‌کرده'],
    [/sweet\s*potato\s*sticks/i, 'خلال سیب‌زمینی شیرین'],
    [/sweet\s*potatoes?/i, 'سیب‌زمینی شیرین'],
    [/shredded\s*(?:purple|red)\s*cabbages?/i, 'خلال کلم بنفش'],
    [/(?:purple|red)\s*cabbages?/i, 'کلم بنفش'],
    [/micro\s*greens?/i, 'جوانه ریز'],
    [/chicken\s*breast/i, 'سینه مرغ'],
    [/cherry\s*tomatoes?/i, 'گوجه گیلاسی'],
    [/tomato\s*sauce|ketchup/i, 'سس گوجه'],
    [/olive\s*oil/i, 'روغن زیتون'],
    [/sour\s*cream/i, 'خامه ترش'],
    [/sesame\s*(bun|bread|seed)?s?/i, 'نان کنجدی'],
    [/hot\s*dogs?/i, 'هات‌داگ'],
    [/soft\s*drinks?|sodas?|cola/i, 'نوشابه'],
    [/beef\s*sandwich(?:es)?/i, 'ساندویچ گوشت گوساله'],
    [/sausage\s*sandwich(?:es)?/i, 'ساندویچ سوسیس'],
    [/meat\s*sandwich(?:es)?/i, 'ساندویچ گوشت'],
  ];
  const FOODS = [
    [/sandwich(?:es)?/i, 'ساندویچ'],
    [/sausages?|bratwurst/i, 'سوسیس'],
    [/burgers?|hamburgers?/i, 'همبرگر'],
    [/buns?/i, 'نان'],
    [/mustard/i, 'خردل'],
    [/pickles?/i, 'خیارشور'],
    [/lettuce|khas/i, 'کاهو'],
    [/sesame/i, 'کنجد'],
    [/cheddar|cheese/i, 'پنیر'],
    [/brown\s*rice/i, 'برنج قهوه‌ای'],
    [/white\s*rice/i, 'برنج سفید'],
    [/green\s*beans?/i, 'لوبیا سبز'],
    [/bell\s*peppers?/i, 'فلفل دلمه‌ای'],
    [/salmon/i, 'سالمون'],
    [/tuna/i, 'تن ماهی'],
    [/fish/i, 'ماهی'],
    [/broccoli/i, 'بروکلی'],
    [/cauliflower/i, 'گل‌کلم'],
    [/cabbages?/i, 'کلم'],
    [/avocados?/i, 'آووکادو'],
    [/seeds?/i, 'هسته'],
    [/beetroots?|beets?/i, 'چغندر'],
    [/carrots?/i, 'هویج'],
    [/zucchinis?|courgettes?/i, 'کدو سبز'],
    [/potatoes?/i, 'سیب‌زمینی'],
    [/tomatoes?/i, 'گوجه'],
    [/cucumbers?/i, 'خیار'],
    [/spinach/i, 'اسفناج'],
    [/chicken/i, 'مرغ'],
    [/beef|steak/i, 'گوشت گوساله'],
    [/lamb/i, 'گوشت بره'],
    [/shrimp|prawns?/i, 'میگو'],
    [/rice/i, 'برنج'],
    [/bread/i, 'نان'],
    [/yogurt|yoghurt/i, 'ماست'],
    [/olives?/i, 'زیتون'],
    [/limes?/i, 'لیمو'],
    [/lemons?/i, 'لیموترش'],
    [/corn/i, 'ذرت'],
    [/onions?/i, 'پیاز'],
    [/garlic/i, 'سیر'],
    [/peppers?/i, 'فلفل'],
    [/mushrooms?/i, 'قارچ'],
    [/eggs?/i, 'تخم‌مرغ'],
    [/butter/i, 'کره'],
    [/sauces?/i, 'سس'],
    [/meats?/i, 'گوشت'],
  ];
  const COOKS = [
    [/breaded|katsu|tempura/i, 'سوخاری'],
    [/roasted|roast/i, 'برشته'],
    [/grilled/i, 'گریل'],
    [/fried|sauteed|sautéed/i, 'سرخ‌شده'],
    [/steamed/i, 'بخارپز'],
    [/boiled|poached/i, 'آب‌پز'],
    [/smoked/i, 'دودی'],
    [/mashed/i, 'پوره'],
    [/cooked/i, 'پخته'],
    [/raw|fresh/i, 'تازه'],
  ];
  const CUTS = [
    [/wedges?/i, 'قاچ'],
    [/sliced|slices?/i, 'ورقه'],
    [/shredded/i, 'خلال'],
    [/sticks?/i, 'خلال'],
    [/halves?|half/i, 'نصف'],
    [/chopped|diced|cubed/i, 'خردشده'],
  ];
  const FA_FIXES = [
    [/سمسمی|سمسم/g, 'کنجدی'],
    [/(^|[^\u0600-\u06FF])خس(?=[^\u0600-\u06FF]|$)/g, '$1کاهو'],
    [/سیب‌زمینی تلی|سیب زمینی تلی|تلی/g, 'سیب‌زمینی سرخ‌کرده'],
    [/مردمک/g, 'خیارشور'],
    [/(^|[^\u0600-\u06FF])سوس(?=[^\u0600-\u06FF]|$)/g, '$1سس'],
    [/سلمنون|سالمونون/g, 'سالمون'],
    [/برکلی/g, 'بروکلی'],
    [/هیجول/g, 'هویج'],
    [/چقندر/g, 'چغندر'],
    [/اسلایس/g, 'ورقه'],
    [/سوخاری/g, 'برشته'],
    [/رسته/g, 'برشته'],
    [/موج\s*لیمو/g, 'قاچ لیمو'],
    [/\s*و\s*اکسیر/g, ''],
  ];

  function pick(list, text) {
    const hit = list.find(([from]) => from.test(text));
    return hit ? hit[1] : '';
  }

  function translateChunk(chunk) {
    const phrase = pick(PHRASES, chunk);
    if (phrase) return phrase;
    const food = pick(FOODS, chunk);
    if (!food) return '';
    const cook = pick(COOKS, chunk);
    const cut = pick(CUTS, chunk);
    return [cut, food, cook].filter(Boolean).join(' ');
  }

  function faFromEnglish(en) {
    const raw = String(en || '').trim();
    if (!raw) return '';
    const whole = translateChunk(raw);
    const parts = raw.split(/\s*(?:,|\/|&|\band\b|\bwith\b|\bplus\b)\s*/i).filter(Boolean);
    if (parts.length <= 1) return whole;
    const translated = parts.map(translateChunk).filter(Boolean);
    if (!translated.length) return whole;
    if (translated.length === 1) return translated[0];
    return `${translated[0]} با ${translated.slice(1).join(' و ')}`;
  }

  function applyFaFixes(text) {
    let out = String(text || '').trim();
    FA_FIXES.forEach(([from, to]) => {
      out = out.replace(from, to);
    });
    return out.replace(/\s+/g, ' ').trim();
  }

  function looksEnglish(text) {
    const value = String(text || '');
    return /[a-z]/i.test(value) && !/[\u0600-\u06FF]/.test(value);
  }

  function polishFa(fa, en) {
    const fromEn = faFromEnglish(en);
    const fromFa = looksEnglish(fa) ? faFromEnglish(fa) : '';
    return applyFaFixes(fromEn || fromFa || fa);
  }

  function polishName(name) {
    const en = String(name?.en || '').trim();
    const fa = String(name?.fa || '').trim();
    const ar = String(name?.ar || en || '');
    return {
      fa: polishFa(fa, en) || fa,
      en: en || fa,
      ar,
    };
  }

  const BASE_PROMPT = `You are a nutrition assistant. Analyze the food in this image.
Put SIMPLE everyday English in every "en" field. Leave "fa" and "ar" empty.

Return ONLY valid JSON (no markdown) with this exact structure:
{
  "foodName": { "fa": "", "en": "English name", "ar": "" },
  "calories": number,
  "protein": number,
  "fat": number,
  "saturatedFat": number,
  "carbs": number,
  "fiber": number,
  "sugar": number,
  "salt": number,
  "portionNote": { "fa": "", "en": "English portion description", "ar": "" },
  "confidence": "low" | "medium" | "high",
  "components": [
    { "name": { "fa": "", "en": "...", "ar": "" }, "grams": number, "calories": number, "sugar": number }
  ]
}
Rules:
- calories in kcal; protein/fat/saturatedFat/carbs/fiber/sugar/salt in grams for the TOTAL plate
- Weights are ESTIMATES. Only list foods visibly on the plate.
- LANGUAGE: "en" must be short English food names. Leave fa/ar empty.
- All numbers must be non-negative numbers, not strings`;

  const ESTIMATE_PROMPT = `Analyze this food plate image carefully. List EVERY separate visible food item.
Put SIMPLE English in every "en" field. Leave "fa" and "ar" empty.
Return ONLY valid JSON (no markdown):
{
  "foodName": { "fa": "", "en": "English dish name", "ar": "" },
  "items": [
    { "id": "item-1", "name": { "fa": "", "en": "English item name", "ar": "" }, "estimatedGrams": number }
  ],
  "estimatedTotalGrams": number
}
List EACH food separately. Never merge different foods. Include sauces and garnishes if visible.`;

  function hostIsStatic() {
    const host = String(location.hostname || '');
    return host.endsWith('github.io') || host.endsWith('workers.dev');
  }

  function enabled() {
    if (String(window.HNP_API || '').trim()) return false;
    return hostIsStatic();
  }

  function workerBase() {
    const fromConfig = window.HNP_OPENROUTER && window.HNP_OPENROUTER.workerUrl;
    const base = String(fromConfig || DEFAULT_WORKER).replace(/\/$/, '');
    if (base.toLowerCase().includes(STATIC_SITE_WORKER)) return DEFAULT_WORKER;
    return base || DEFAULT_WORKER;
  }

  function optionalGrams(value) {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 10) / 10 : 0;
  }

  function requireFinite(value, field) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) {
      throw new Error(`Invalid nutrition number: ${field}`);
    }
    return Math.round(n * 10) / 10;
  }

  function stringList(value) {
    if (!Array.isArray(value)) return [];
    return value.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 8);
  }

  function sumField(rows, field) {
    return Math.round(rows.reduce((sum, row) => sum + (Number(row[field]) || 0), 0) * 10) / 10;
  }

  function parseModelJson(text) {
    const cleaned = String(text || '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start < 0 || end <= start) throw new Error('مدل JSON معتبر نداد.');
    return JSON.parse(cleaned.slice(start, end + 1));
  }

  function validateResult(data, modelUsed, portionInfo) {
    const required = ['foodName', 'calories', 'protein', 'sugar', 'salt', 'portionNote', 'confidence'];
    for (const key of required) {
      if (data[key] == null) throw new Error(`Missing field: ${key}`);
    }
    const result = {
      foodName: polishName({
        fa: String(data.foodName.fa || ''),
        en: String(data.foodName.en || ''),
        ar: String(data.foodName.ar || data.foodName.en || ''),
      }),
      calories: requireFinite(data.calories, 'calories'),
      protein: requireFinite(data.protein, 'protein'),
      fat: optionalGrams(data.fat),
      saturatedFat: optionalGrams(data.saturatedFat),
      carbs: optionalGrams(data.carbs),
      fiber: optionalGrams(data.fiber),
      sugar: requireFinite(data.sugar, 'sugar'),
      salt: requireFinite(data.salt, 'salt'),
      portionNote: polishName({
        fa: String(data.portionNote.fa || ''),
        en: String(data.portionNote.en || ''),
        ar: String(data.portionNote.ar || data.portionNote.en || ''),
      }),
      confidence: ['low', 'medium', 'high'].includes(data.confidence) ? data.confidence : 'medium',
      estimated: true,
      assumptions: stringList(data.assumptions),
      uncertainties: stringList(data.uncertainties),
      source: 'openrouter',
      modelUsed,
      portionMode: portionInfo.mode,
    };
    if (Array.isArray(data.components) && data.components.length > 0) {
      result.components = data.components.map((c) => {
        const grams = requireFinite(c.grams, 'grams');
        if (grams <= 0) throw new Error('Invalid nutrition number: grams');
        return {
          name: polishName({
            fa: String(c.name?.fa || ''),
            en: String(c.name?.en || ''),
            ar: String(c.name?.ar || c.name?.en || ''),
          }),
          grams,
          calories: requireFinite(c.calories, 'calories'),
          protein: optionalGrams(c.protein),
          fat: optionalGrams(c.fat),
          carbs: optionalGrams(c.carbs),
          fiber: optionalGrams(c.fiber),
          sugar: optionalGrams(c.sugar),
          salt: optionalGrams(c.salt),
        };
      });
      result.calories = sumField(result.components, 'calories');
      result.sugar = sumField(result.components, 'sugar');
      const proteinSum = sumField(result.components, 'protein');
      const fatSum = sumField(result.components, 'fat');
      const carbsSum = sumField(result.components, 'carbs');
      const fiberSum = sumField(result.components, 'fiber');
      const saltSum = sumField(result.components, 'salt');
      if (proteinSum > 0) result.protein = proteinSum;
      if (fatSum > 0) result.fat = fatSum;
      if (carbsSum > 0) result.carbs = carbsSum;
      if (fiberSum > 0) result.fiber = fiberSum;
      if (saltSum > 0) result.salt = saltSum;
    }
    return result;
  }

  function parseGramValue(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  }

  function validatePlateEstimate(data) {
    const rawItems = Array.isArray(data.items) ? data.items : [];
    const items = rawItems
      .map((item, index) => {
        const grams = parseGramValue(item.estimatedGrams);
        if (!grams) return null;
        return {
          id: String(item.id || `item-${index + 1}`),
          name: polishName({
            fa: String(item.name?.fa || `مورد ${index + 1}`),
            en: String(item.name?.en || `Item ${index + 1}`),
            ar: String(item.name?.ar || item.name?.en || ''),
          }),
          estimatedGrams: grams,
        };
      })
      .filter(Boolean);
    if (!items.length) throw new Error('No food items detected on plate');
    return {
      foodName: polishName({
        fa: String(data.foodName?.fa || 'غذا'),
        en: String(data.foodName?.en || 'Food'),
        ar: String(data.foodName?.ar || data.foodName?.en || ''),
      }),
      items,
      estimatedTotalGrams:
        parseGramValue(data.estimatedTotalGrams) ||
        items.reduce((sum, item) => sum + item.estimatedGrams, 0),
    };
  }

  function buildAnalyzePrompt(portionInfo) {
    if (portionInfo.mode !== 'manual') {
      return `${BASE_PROMPT}\n- Estimate for the visible portion on the plate`;
    }
    const items = portionInfo.items || [];
    const lines = items.map((item) => `- ${item.name.en} (${item.name.fa}): ${item.grams} grams`);
    return `${BASE_PROMPT}
- The user confirmed these exact item weights — use ONLY these amounts:
${lines.join('\n')}
- Fill components array with each item
- Set confidence to "high"`;
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('خواندن عکس ناموفق بود.'));
      reader.readAsDataURL(blob);
    });
  }

  async function callWorker(prompt, dataUrl) {
    let lastError = null;
    for (const model of MODELS) {
      let response;
      try {
        response = await fetch(`${workerBase()}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt.slice(0, 6000) },
                  { type: 'image_url', image_url: { url: dataUrl } },
                ],
              },
            ],
          }),
        });
      } catch {
        throw new Error('به ورکر اسکن وصل نشد. اینترنت را چک کن.');
      }
      const raw = await response.text();
      if (raw.trim().startsWith('<')) {
        throw new Error(
          typeof I18N !== 'undefined' ? I18N.t('err.htmlResponse') : 'پاسخ HTML به‌جای JSON آمد.'
        );
      }
      let data = {};
      try {
        data = JSON.parse(raw);
      } catch {
        lastError = new Error(
          typeof I18N !== 'undefined' ? I18N.t('err.htmlResponse') : 'پاسخ JSON نبود.'
        );
        continue;
      }
      if (!response.ok) {
        lastError = new Error(data.error?.message || 'سرویس تحلیل غذا الان جواب نداد.');
        if (response.status === 404 || response.status === 400) continue;
        throw lastError;
      }
      const text = data.choices?.[0]?.message?.content;
      if (!text || !String(text).trim()) {
        lastError = new Error('مدل جواب خالی داد.');
        continue;
      }
      return { text: String(text), modelUsed: data.model || model };
    }
    throw lastError || new Error('سرویس تحلیل غذا الان جواب نداد.');
  }

  async function analyze(blob, portionInfo) {
    const dataUrl = await blobToDataUrl(blob);
    const { text, modelUsed } = await callWorker(buildAnalyzePrompt(portionInfo), dataUrl);
    return validateResult(parseModelJson(text), modelUsed, portionInfo);
  }

  async function estimate(blob) {
    const dataUrl = await blobToDataUrl(blob);
    const { text } = await callWorker(ESTIMATE_PROMPT, dataUrl);
    return validatePlateEstimate(parseModelJson(text));
  }

  window.HNP_PAGES_VISION = { enabled, analyze, estimate };
})();
