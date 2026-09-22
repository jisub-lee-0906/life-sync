export function neutralizeCsvCell(value: string) {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

export function toCsv(rows: Record<string, string>[]) {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);
  return [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => `"${neutralizeCsvCell(row[header] ?? "").replace(/"/g, '""')}"`)
        .join(","),
    ),
  ].join("\n");
}
