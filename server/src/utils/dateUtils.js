/**
 * Centralized Server Date & Time Utility for ExamForge Application
 * Timezone: Asia/Kolkata (IST)
 */

const APPLICATION_TIMEZONE = 'Asia/Kolkata';

/**
 * Converts a JS Date / ISO string / Timestamp to an HTML <input type="datetime-local"> string in Asia/Kolkata wall-clock time ("YYYY-MM-DDTHH:mm")
 */
function dateToDateTimeLocalString(dateInput) {
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
function dateTimeLocalToISOString(dateTimeLocalStr) {
  if (!dateTimeLocalStr) return null;
  const str = String(dateTimeLocalStr).trim();
  if (!str) return null;

  if (str.includes('Z') || str.includes('+') || (str.lastIndexOf('-') > 10)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  const fullStr = str.length === 16 ? `${str}:00+05:30` : str.length === 19 ? `${str}+05:30` : str;
  const d = new Date(fullStr);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Parses an input string / Date / timestamp into a JS Date object.
 * If input is a wall-clock string without timezone offset (e.g., "2026-10-09T20:43"),
 * it interprets it as Asia/Kolkata (IST = +05:30).
 */
function parseISTDateTime(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }

  const str = String(dateInput).trim();
  if (!str) return null;

  const hasOffset = str.includes('Z') || str.includes('+') || (str.lastIndexOf('-') > 10);
  if (hasOffset) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  const normalizedStr = str.replace(' ', 'T');
  const fullStr = normalizedStr.length === 16 ? `${normalizedStr}:00+05:30` : normalizedStr.length === 19 ? `${normalizedStr}+05:30` : normalizedStr;
  const d = new Date(fullStr);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formats a Date/ISO string to IST full date and time string (e.g., "09-10-2026 20:43 IST")
 */
function formatExamDateTime(dateInput) {
  if (!dateInput) return 'N/A';
  const date = parseISTDateTime(dateInput);
  if (!date || isNaN(date.getTime())) return 'N/A';

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
function formatExamDate(dateInput) {
  if (!dateInput) return 'N/A';
  const date = parseISTDateTime(dateInput);
  if (!date || isNaN(date.getTime())) return 'N/A';

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
function formatExamTime(dateInput) {
  if (!dateInput) return 'N/A';
  const date = parseISTDateTime(dateInput);
  if (!date || isNaN(date.getTime())) return 'N/A';

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

module.exports = {
  APPLICATION_TIMEZONE,
  dateToDateTimeLocalString,
  dateTimeLocalToISOString,
  parseISTDateTime,
  formatExamDateTime,
  formatExamDate,
  formatExamTime,
};
