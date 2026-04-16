/**
 * Timezone- and locale-aware date formatting.
 * Uses settings from SettingsContext (timezone, language, dateFormat).
 *
 * Usage:
 *   import { formatDate, formatDateTime } from '../utils/formatDate';
 *   import { useLocaleSettings } from '../context/SettingsContext';
 *
 *   const { timezone, language } = useLocaleSettings();
 *   formatDate(item.createdAt, { timezone, language });
 */

const LOCALE_MAP = {
  en: "en-US",
  si: "si-LK",
  ta: "ta-IN",
  fr: "fr-FR",
};

function toLocale(language) {
  return LOCALE_MAP[language] || "en-US";
}

/**
 * Format a date value to a localised date string.
 * @param {string|Date|number} date
 * @param {{ timezone?: string, language?: string }} options
 */
export function formatDate(date, { timezone = "Asia/Colombo", language = "en" } = {}) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d)) return String(date);

  return new Intl.DateTimeFormat(toLocale(language), {
    timeZone: timezone,
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

/**
 * Format a date value to a localised date-time string.
 * @param {string|Date|number} date
 * @param {{ timezone?: string, language?: string }} options
 */
export function formatDateTime(date, { timezone = "Asia/Colombo", language = "en" } = {}) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d)) return String(date);

  return new Intl.DateTimeFormat(toLocale(language), {
    timeZone: timezone,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Format a date value to a localised time string only.
 * @param {string|Date|number} date
 * @param {{ timezone?: string, language?: string }} options
 */
export function formatTime(date, { timezone = "Asia/Colombo", language = "en" } = {}) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d)) return String(date);

  return new Intl.DateTimeFormat(toLocale(language), {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
