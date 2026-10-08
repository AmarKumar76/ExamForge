const {
  parseISTDateTime,
  formatExamDateTime,
  formatExamDate,
  formatExamTime,
  dateToDateTimeLocalString,
  dateTimeLocalToISOString,
} = require('../src/utils/dateUtils');

describe('Timezone & Exam Schedule Verification (Asia/Kolkata IST)', () => {

  test('CASE 1: Instructor enters 09-10-2026 20:43 -> Student sees 09-10-2026 20:43 IST', () => {
    // Instructor UI datetime-local input string
    const inputStr = '2026-10-09T20:43';

    // Frontend converts to ISO payload before API submission
    const isoPayload = dateTimeLocalToISOString(inputStr);
    expect(isoPayload).not.toBeNull();

    // Verify stored ISO timestamp instant is 15:13:00.000Z UTC (20:43 - 5h30m)
    const storedDate = new Date(isoPayload);
    expect(storedDate.toISOString()).toBe('2026-10-09T15:13:00.000Z');

    // Student UI / Backend formats stored instant back to IST
    const studentDisplay = formatExamDateTime(storedDate);
    expect(studentDisplay).toBe('09-10-2026 20:43 IST');
  });

  test('CASE 2: Instructor enters 10-10-2026 05:11 -> Student sees 10-10-2026 05:11 IST', () => {
    const inputStr = '2026-10-10T05:11';
    const isoPayload = dateTimeLocalToISOString(inputStr);
    const storedDate = new Date(isoPayload);

    // 05:11 IST on 10-10-2026 = 23:41 UTC on 09-10-2026
    expect(storedDate.toISOString()).toBe('2026-10-09T23:41:00.000Z');

    const studentDisplay = formatExamDateTime(storedDate);
    expect(studentDisplay).toBe('10-10-2026 05:11 IST');
  });

  test('CASE 3: Schedule crossing midnight (Start: 09-10-2026 23:30, End: 10-10-2026 01:30)', () => {
    const startInput = '2026-10-09T23:30';
    const endInput = '2026-10-10T01:30';

    const startISO = dateTimeLocalToISOString(startInput);
    const endISO = dateTimeLocalToISOString(endInput);

    const startDate = parseISTDateTime(startISO);
    const endDate = parseISTDateTime(endISO);

    expect(endDate > startDate).toBe(true);
    expect(formatExamDateTime(startDate)).toBe('09-10-2026 23:30 IST');
    expect(formatExamDateTime(endDate)).toBe('10-10-2026 01:30 IST');
  });

  test('CASE 4: Create exam, reload page, verify inputs remain unchanged', () => {
    const originalInput = '2026-10-09T20:43';
    const isoPayload = dateTimeLocalToISOString(originalInput);

    // Simulating API response from Mongoose/MongoDB
    const apiExamResponse = {
      startTime: isoPayload,
    };

    // Client populates input field when loading exam for edit
    const reloadedInput = dateToDateTimeLocalString(apiExamResponse.startTime);
    expect(reloadedInput).toBe(originalInput);
  });

  test('CASE 5: Check exam availability logic at exact IST boundary', () => {
    const examStartInput = '2026-10-09T20:43';
    const examStartISO = dateTimeLocalToISOString(examStartInput);
    const examStartDate = new Date(examStartISO);

    // Exactly at 20:42:59 IST (15:12:59 UTC), exam is NOT yet active
    const justBefore = new Date('2026-10-09T15:12:59.000Z');
    expect(justBefore < examStartDate).toBe(true);

    // At 20:43:00 IST (15:13:00 UTC), exam is LIVE/Active
    const exactStart = new Date('2026-10-09T15:13:00.000Z');
    expect(exactStart >= examStartDate).toBe(true);
  });
});
