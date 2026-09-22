"use client";

import { Button } from "@/components/ui/button";
import { toCsv } from "@/lib/csv-export";

type CsvExportButtonProps = {
  disabled?: boolean;
  onExport: () => Promise<Record<string, string>[]>;
};

export function CsvExportButton({ disabled, onExport }: CsvExportButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full justify-center sm:w-auto"
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
