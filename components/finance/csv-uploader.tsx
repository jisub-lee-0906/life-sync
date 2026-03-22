"use client";

import { useRef } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { normalizeCsvUploadRow, type CsvTransactionRow } from "@/lib/finance";

type CsvUploaderProps = {
  disabled?: boolean;
  onImport: (rows: CsvTransactionRow[]) => Promise<void> | void;
};

type ParsedCsvRow = Record<string, string | undefined>;

export function CsvUploader({ disabled, onImport }: CsvUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function handleFile(file: File) {
    const parsed = await new Promise<ParsedCsvRow[]>((resolve, reject) => {
      Papa.parse<ParsedCsvRow>(file, {
        complete: (result) => resolve(result.data),
        error: (error) => reject(error),
        header: true,
        skipEmptyLines: true,
      });
    });

    const rows = parsed.map((row) => normalizeCsvUploadRow(row));

    await onImport(rows);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];

          if (!file) {
            return;
          }

          await handleFile(file);
          event.currentTarget.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        Import CSV
      </Button>
    </div>
  );
}
