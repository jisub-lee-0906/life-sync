export function buildTransactionCursor(date: Date, id: string) {
  return {
    date: date.toISOString(),
    id,
  };
}
