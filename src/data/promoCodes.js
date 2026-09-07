const STORAGE_KEY = 'multimath_promo_session';
const USAGE_KEY = 'multimath_promo_usage';

/** Demo codes — replace with API call in production */
export const PROMO_CODES = {
  MATH1: { expiresAt: '2026-12-31T23:59:59', maxUses: 100 },
  DEMO7: { expiresAt: '2026-06-30T23:59:59', maxUses: 1 },
  TEST9: { expiresAt: null, maxUses: Infinity },
};

export const PROMO_ERRORS = {
  invalid: {
    title: 'Промокод дұрыс емес',
    hint: 'Кодты тексеріп, қайта енгізіңіз.',
  },
  expired: {
    title: 'Промокод мерзімі өткен',
    hint: 'Бұл код енді жарамсыз. Жаңа код сұраңыз.',
  },
  used: {
    title: 'Промокод бұрын қолданылған',
    hint: 'Бұл код қазірдің өзінде пайдаланылған.',
  },
};

function readUsage() {
  try {
    return JSON.parse(localStorage.getItem(USAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeUsage(data) {
  localStorage.setItem(USAGE_KEY, JSON.stringify(data));
}

export function getPromoSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session?.code || !session?.verifiedAt) return null;

    const def = PROMO_CODES[session.code];
    if (!def) {
      clearPromoSession();
      return null;
    }
    if (def.expiresAt && Date.now() > new Date(def.expiresAt).getTime()) {
      clearPromoSession();
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function clearPromoSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function validatePromoCode(raw) {
  const code = raw.trim().toUpperCase();

  if (!/^[A-Z0-9]{5}$/.test(code)) {
    return { ok: false, reason: 'invalid' };
  }

  const def = PROMO_CODES[code];
  if (!def) {
    return { ok: false, reason: 'invalid' };
  }

  if (def.expiresAt && Date.now() > new Date(def.expiresAt).getTime()) {
    return { ok: false, reason: 'expired' };
  }

  const usage = readUsage();
  const usedCount = usage[code]?.count || 0;
  if (def.maxUses !== Infinity && usedCount >= def.maxUses) {
    return { ok: false, reason: 'used' };
  }

  usage[code] = {
    count: usedCount + 1,
    lastUsedAt: new Date().toISOString(),
  };
  writeUsage(usage);

  const session = { code, verifiedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

  return { ok: true, session };
}

/** Simulate network delay for realistic UX */
export function validatePromoCodeAsync(raw) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(validatePromoCode(raw)), 450);
  });
}
