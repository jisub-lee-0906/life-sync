"use client";

import { Button } from "@/components/ui/button";

type CsvExportButtonProps = {
  disabled?: boolean;
  onExport: () => Promise<Record<string, string>[]>;
};

function toCsv(rows: Record<string, string>[]) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => `"${(row[header] ?? "").replace(/"/g, '""')}"`)
        .join(","),
    ),
  ];

  return lines.join("\n");
}

export function CsvExportButton({ disabled, onExport }: CsvExportButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={async () => {
        const rows = await onExport();
        const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "lifesync-가계부.csv";
        anchor.click();
        URL.revokeObjectURL(url);
      }}
    >
      CSV 내보내기
    </Button>
  );
}
