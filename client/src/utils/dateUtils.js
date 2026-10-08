/**
 * Centralized Date & Time Utility for ExamForge Application
 * Timezone: Asia/Kolkata (IST)
 */

export const APPLICATION_TIMEZONE = 'Asia/Kolkata';

/**
 * Converts a JS Date / ISO string / Timestamp to an HTML <input type="datetime-local"> string in Asia/Kolkata wall-clock time ("YYYY-MM-DDTHH:mm")
 */
export function dateToDateTimeLocalString(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: APPLICATION_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type) => parts.find((p) => p.type === type)?.value || '';

  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  const hour = getPart('hour');
  const minute = getPart('minute');

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Converts a datetime-local input string ("YYYY-MM-DDTHH:mm") into an ISO string with Asia/Kolkata offset (+05:30)
 */
export function dateTimeLocalToISOString(dateTimeLocalStr) {
  if (!dateTimeLocalStr) return null;
  const str = String(dateTimeLocalStr).trim();
  if (!str) return null;

  // If string already includes timezone offset or Z
  if (str.includes('Z') || str.includes('+') || (str.lastIndexOf('-') > 10)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  // Treat input wall-clock string as Asia/Kolkata (IST = +05:30)
  const fullStr = str.length === 16 ? `${str}:00+05:30` : str.length === 19 ? `${str}+05:30` : str;
  const d = new Date(fullStr);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Formats a Date/ISO string to IST full date and time string (e.g., "09-10-2026 20:43 IST")
 */
export function formatExamDateTime(dateInput) {
  if (!dateInput) return 'N/A';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'N/A';

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: APPLICATION_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type) => parts.find((p) => p.type === type)?.value || '';

  const day = getPart('day');
  const month = getPart('month');
  const year = getPart('year');
  const hour = getPart('hour');
  const minute = getPart('minute');

  return `${day}-${month}-${year} ${hour}:${minute} IST`;
}

/**
 * Formats a Date/ISO string to IST date only (e.g., "09-10-2026")
 */
export function formatExamDate(dateInput) {
  if (!dateInput) return 'N/A';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'N/A';

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: APPLICATION_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type) => parts.find((p) => p.type === type)?.value || '';

  const day = getPart('day');
  const month = getPart('month');
  const year = getPart('year');

  return `${day}-${month}-${year}`;
}

/**
 * Formats a Date/ISO string to IST time only (e.g., "20:43")
 */
export function formatExamTime(dateInput) {
  if (!dateInput) return 'N/A';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'N/A';

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: APPLICATION_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type) => parts.find((p) => p.type === type)?.value || '';

  const hour = getPart('hour');
  const minute = getPart('minute');

  return `${hour}:${minute}`;
}
