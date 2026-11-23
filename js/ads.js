function isStaticHost() {
  const host = String(location.hostname || '');
  return host.endsWith('github.io') || host.endsWith('workers.dev');
}

function publicAsset(src) {
  const value = String(src || '');
  if (!value) return '';
  if (/^https?:/i.test(value)) return value;
  if (value.startsWith('/assets/')) return value.slice(1);
  return value;
}

function normalizeAd(ad) {
  if (!ad || typeof ad !== 'object') return ad;
  const next = { ...ad, image: publicAsset(ad.image) };
  if (Array.isArray(ad.slides)) {
    next.slides = ad.slides.map((slide) => ({ ...slide, image: publicAsset(slide.image) }));
  }
  return next;
}

function adMarkup(ad) {
  return `<a class="ad-inner${ad.image ? ' has-image' : ''}" href="${ad.href || '#'}" rel="noopener">${ad.image ? `<img src="${ad.image}" alt="">` : ''}<span class="ad-copy"><span>${ad.title || ''}</span><small>${ad.text || ''}</small></span></a>`;
}

function startSlider(el, slides) {
  let index = 0;
  const track = el.querySelector('.ad-track');
  const dots = [...el.querySelectorAll('.ad-dot')];
  if (!track || slides.length < 2) return;

  const go = (next) => {
    index = (next + slides.length) % slides.length;
    track.style.transform = `translateX(${-index * 100}%)`;
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  };

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => go(i));
  });

  setInterval(() => go(index + 1), 3800);
}

async function readJson(response) {
  const raw = await response.text();
  const trimmed = String(raw || '').trim();
  if (!trimmed || trimmed.startsWith('<')) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

async function loadAds() {
  if (!isStaticHost()) {
    try {
      const response = await fetch('/api/ads');
      const data = await readJson(response);
      if (response.ok && Array.isArray(data?.ads) && data.ads.length) {
        return data.ads.map(normalizeAd);
      }
    } catch {
      /* fall through */
    }
  }
  const response = await fetch('data/ads.json');
  const data = await readJson(response);
  return (data?.ads || []).map(normalizeAd);
}

async function mountAds() {
  try {
    const ads = await loadAds();
    document.querySelectorAll('.ad-slot').forEach((el) => {
      const pack = ads.find((item) => item.slot === el.dataset.slot) || ads[0];
      if (!pack) return;
      const slides = pack.slides && pack.slides.length ? pack.slides : [pack];
      if (slides.length > 1) {
        el.classList.add('is-slider');
        el.innerHTML = `<div class="ad-viewport"><div class="ad-track">${slides.map(adMarkup).join('')}</div></div><div class="ad-dots">${slides.map((_, i) => `<button type="button" class="ad-dot${i === 0 ? ' active' : ''}" aria-label="${i + 1}"></button>`).join('')}</div>`;
        startSlider(el, slides);
      } else {
        el.innerHTML = adMarkup(slides[0]);
      }
    });
  } catch {
    /* ignore */
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountAds);
} else {
  mountAds();
}
