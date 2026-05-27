function buildUtcDate(year: number, monthIndex: number, day: number) {
  const date = new Date(0);
  date.setUTCFullYear(year, monthIndex, day);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export function parseValidatedYearMonth(value: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value);

  if (!match) {
    throw new Error("월 형식을 다시 확인해 주세요.");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (year < 1) {
    throw new Error("연도를 다시 확인해 주세요.");
  }

  if (month < 1 || month > 12) {
    throw new Error("월을 다시 확인해 주세요.");
  }

  const monthStart = buildUtcDate(year, month - 1, 1);

  if (
    monthStart.getUTCFullYear() !== year ||
    monthStart.getUTCMonth() !== month - 1
  ) {
    throw new Error("연도를 다시 확인해 주세요.");
  }

  return {
    monthIndex: month - 1,
    year,
    yearMonth: value,
  };
}

export function parseValidatedCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new Error("날짜 형식을 다시 확인해 주세요.");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1) {
    throw new Error("날짜를 다시 확인해 주세요.");
  }

  const date = buildUtcDate(year, month - 1, day);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("날짜를 다시 확인해 주세요.");
  }

  return {
    date,
    dateString: value,
  };
}
