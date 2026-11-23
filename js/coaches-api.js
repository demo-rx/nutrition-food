(function () {
  const REVIEW_KEY = 'hnp-page-coach-reviews';

  function apiBase() {
    return String(window.HNP_API || '').replace(/\/$/, '');
  }

  function isStaticHost() {
    const host = String(location.hostname || '');
    return host.endsWith('github.io') || host.endsWith('workers.dev');
  }

  function publicAsset(src) {
    const value = String(src || '');
    if (!value) return '';
    if (/^https?:/i.test(value)) return value;
    if (isStaticHost() && value.startsWith('/')) return value.slice(1);
    return value;
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

  function normalizeCoach(coach) {
    if (!coach) return null;
    return {
      ...coach,
      photo: publicAsset(coach.photo),
      planFile: publicAsset(coach.planFile),
      videos: Array.isArray(coach.videos) ? coach.videos : [],
      reviews: Array.isArray(coach.reviews) ? coach.reviews : [],
      athleteCount: Number(coach.athleteCount) || 0,
    };
  }

  function localReviewsMap() {
    try {
      return JSON.parse(localStorage.getItem(REVIEW_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function mergeReviews(coach) {
    const extra = localReviewsMap()[coach.id] || [];
    const seen = new Set((coach.reviews || []).map((item) => `${item.name}|${item.text}|${item.at}`));
    const added = extra.filter((item) => !seen.has(`${item.name}|${item.text}|${item.at}`));
    return { ...coach, reviews: [...added, ...(coach.reviews || [])] };
  }

  function saveLocalReview(coachId, entry) {
    const all = localReviewsMap();
    const list = Array.isArray(all[coachId]) ? all[coachId] : [];
    all[coachId] = [entry, ...list].slice(0, 40);
    localStorage.setItem(REVIEW_KEY, JSON.stringify(all));
  }

  async function loadCatalog() {
    if (!isStaticHost()) {
      try {
        const response = await fetch(`${apiBase()}/api/coaches`);
        const data = await readJson(response);
        if (response.ok && data?.coaches) {
          return data.coaches.map(normalizeCoach).filter(Boolean);
        }
      } catch {
        /* fall through to static catalog */
      }
    }
    const response = await fetch('data/coaches.json');
    const data = await readJson(response);
    return (data?.coaches || []).map(normalizeCoach).filter(Boolean);
  }

  async function listCoaches() {
    const coaches = await loadCatalog();
    return coaches.map(mergeReviews);
  }

  async function getCoach(id) {
    const coaches = await listCoaches();
    return coaches.find((item) => item.id === id) || null;
  }

  async function postReview(id, payload) {
    if (!isStaticHost()) {
      try {
        const response = await fetch(`${apiBase()}/api/coaches/${encodeURIComponent(id)}/reviews`, {
          method: 'POST',
          headers: payload.headers,
          body: payload.body,
        });
        const data = await readJson(response);
        if (response.ok) return { ok: true, reviews: data?.reviews };
        if (data?.error) return { ok: false, error: data.error };
      } catch {
        /* static fallback */
      }
    }
    saveLocalReview(id, payload.entry);
    return { ok: true };
  }

  async function claimCoach(id, token) {
    if (isStaticHost() || !token) return { ok: true, static: true };
    try {
      const response = await fetch(`${apiBase()}/api/me/coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ coachId: id }),
      });
      const data = await readJson(response);
      if (response.ok) return { ok: true };
      return { ok: false, error: data?.error || 'خرید ثبت نشد' };
    } catch {
      return { ok: true, static: true };
    }
  }

  window.HNP_COACHES = {
    listCoaches,
    getCoach,
    postReview,
    claimCoach,
    publicAsset,
  };
})();
