function buildLocalDate(year: number, monthIndex: number, day: number) {
  return new Date(year, monthIndex, day, 0, 0, 0, 0);
}

export function parseValidatedYearMonth(value: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value);

  if (!match) {
    throw new Error("Invalid year-month format.");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (month < 1 || month > 12) {
    throw new Error("Invalid calendar month.");
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
