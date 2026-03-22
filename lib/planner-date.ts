function buildLocalDate(year: number, monthIndex: number, day: number) {
  const date = new Date(0);
  date.setFullYear(year, monthIndex, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function parseValidatedYearMonth(value: string) {
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

  const monthStart = buildLocalDate(year, month - 1, 1);

  if (monthStart.getFullYear() !== year || monthStart.getMonth() !== month - 1) {
    throw new Error("Invalid calendar year.");
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
    throw new Error("Invalid date format.");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1) {
    throw new Error("Invalid calendar date.");
  }

  const date = buildLocalDate(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error("Invalid calendar date.");
  }

  return {
    date,
    dateString: value,
  };
}
