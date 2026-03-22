import { formatInTimeZone, getTimezoneOffset } from "date-fns-tz";

export const SEOUL_TIME_ZONE = "Asia/Seoul";

function buildUtcDate(year: number, monthIndex: number, day: number) {
  const date = new Date(0);
  date.setUTCFullYear(year, monthIndex, day);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function parseDateOnlyParts(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new Error("Invalid date format.");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1) {
    throw new Error("Invalid calendar date.");
  }

  const utcDate = buildUtcDate(year, month - 1, day);

  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    throw new Error("Invalid calendar date.");
  }

  return {
    day,
    monthIndex: month - 1,
    year,
  };
}

function parseYearMonthParts(value: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value);

  if (!match) {
    throw new Error("Invalid year-month format.");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (year < 1) {
    throw new Error("Invalid calendar year.");
  }

  if (month < 1 || month > 12) {
    throw new Error("Invalid calendar month.");
  }

  return {
    monthIndex: month - 1,
    year,
  };
}

function resolveTimeZoneMidnightUtc(
  year: number,
  monthIndex: number,
  day: number,
  timeZone: string,
) {
  const utcCandidate = buildUtcDate(year, monthIndex, day);
  const offset = getTimezoneOffset(timeZone, utcCandidate);
  return new Date(utcCandidate.getTime() - offset);
}

export function formatTimeZoneDateOnlyValue(date: Date, timeZone: string) {
  return formatInTimeZone(date, timeZone, "yyyy-MM-dd");
}

export function formatTimeZoneYearMonthValue(date: Date, timeZone: string) {
  return formatInTimeZone(date, timeZone, "yyyy-MM");
}

export function parseTimeZoneDateOnlyToUtc(value: string, timeZone: string) {
  const { day, monthIndex, year } = parseDateOnlyParts(value);
  return resolveTimeZoneMidnightUtc(year, monthIndex, day, timeZone);
}

export function buildTimeZoneDayRange(value: string, timeZone: string) {
  const { day, monthIndex, year } = parseDateOnlyParts(value);

  return {
    endExclusive: resolveTimeZoneMidnightUtc(year, monthIndex, day + 1, timeZone),
    start: resolveTimeZoneMidnightUtc(year, monthIndex, day, timeZone),
  };
}

export function buildTimeZoneMonthRange(value: string, timeZone: string) {
  const { monthIndex, year } = parseYearMonthParts(value);

  return {
    endExclusive: resolveTimeZoneMidnightUtc(year, monthIndex + 1, 1, timeZone),
    start: resolveTimeZoneMidnightUtc(year, monthIndex, 1, timeZone),
    yearMonth: value,
  };
}
