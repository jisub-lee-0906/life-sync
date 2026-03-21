"use client";

import { useRef } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import type { CsvTransactionRow } from "@/lib/finance";

type CsvUploaderProps = {
  disabled?: boolean;
  onImport: (rows: CsvTransactionRow[]) => Promise<void> | void;
};

type ParsedCsvRow = Record<string, string | undefined>;

const requiredHeaders = [
  "date",
  "type",
  "category",
  "amount",
  "note",
  "isRecurring",
  "recurrenceDate",
] as const;

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

    const rows = parsed.map((row) => {
      for (const header of requiredHeaders) {
        if (!(header in row)) {
          throw new Error(`CSV must include the '${header}' header.`);
        }
      }

      return {
        amount: row.amount?.replace(/,/g, "") ?? "0",
        category: row.category?.trim() ?? "",
        date: row.date?.trim() ?? "",
        isRecurring: row.isRecurring?.trim() ?? "false",
        note: row.note?.trim() ?? "",
        recurrenceDate: row.recurrenceDate?.trim() ?? "",
        type: row.type?.trim().toUpperCase() ?? "",
      } satisfies CsvTransactionRow;
    });

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
