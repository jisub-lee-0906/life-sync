function readDatePart(
  parts: Intl.DateTimeFormatPart[],
  type: "day" | "month" | "year",
) {
  const value = parts.find((part) => part.type === type)?.value;

  if (!value) {
    throw new Error(`Missing '${type}' date part.`);
  }

  return value;
}

export function formatTimeZoneDateOnlyValue(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);

  const year = readDatePart(parts, "year").padStart(4, "0");
  const month = readDatePart(parts, "month").padStart(2, "0");
  const day = readDatePart(parts, "day").padStart(2, "0");

  return `${year}-${month}-${day}`;
}
