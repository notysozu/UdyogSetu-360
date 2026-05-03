const fs = require('fs');
const path = require('path');

const localeCache = new Map();
const SUPPORTED_LOCALES = ['en', 'kn', 'hi'];

function loadLocale(locale) {
  const code = SUPPORTED_LOCALES.includes(locale) ? locale : 'en';
  if (!localeCache.has(code)) {
    const filePath = path.join(__dirname, '..', 'locales', `${code}.json`);
    localeCache.set(code, JSON.parse(fs.readFileSync(filePath, 'utf8')));
  }
  return localeCache.get(code);
}

function getCurrentLocale(req) {
  const cookieLocale = req.cookies?.us360_language;
  if (SUPPORTED_LOCALES.includes(cookieLocale)) return cookieLocale;
  return 'en';
}

function buildTranslator(locale) {
  const catalog = loadLocale(locale);
  const english = loadLocale('en');
  return function t(key, fallback = key) {
    return catalog[key] || english[key] || fallback;
  };
}

function formatDateForLocale(date, locale) {
  if (!date) return 'Not available';
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-IN' : locale, { dateStyle: 'medium' }).format(new Date(date));
}

function formatCurrencyForLocale(amount, locale) {
  return new Intl.NumberFormat(locale === 'en' ? 'en-IN' : locale, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(amount || 0));
}

module.exports = {
  SUPPORTED_LOCALES,
  buildTranslator,
  getCurrentLocale,
  formatDateForLocale,
  formatCurrencyForLocale
};
