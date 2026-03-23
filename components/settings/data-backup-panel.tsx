"use client";

import { type ChangeEvent, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { restoreBackup } from "@/actions/settings";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DataBackupPanelProps = {
  disabled?: boolean;
};

function resolveRestoreErrorMessage(error: unknown) {
  if (error instanceof SyntaxError) {
    return "백업 파일 형식을 다시 확인해 주세요.";
  }

  if (error instanceof Error) {
    if (/unexpected token|json/i.test(error.message)) {
      return "백업 파일 형식을 다시 확인해 주세요.";
    }

    return error.message;
  }

  return "백업을 복구하지 못했어요.";
}

export function DataBackupPanel({ disabled }: DataBackupPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type && file.type !== "application/json") {
      setMessage("JSON 백업 파일만 복구할 수 있어요.");
      event.target.value = "";
      return;
    }

    const confirmed = window.confirm(
      "복구를 진행하면 현재 데이터가 백업 파일 내용으로 바뀌어요. 계속할까요?",
    );

    if (!confirmed) {
      event.target.value = "";
      return;
    }

    startTransition(async () => {
      try {
        const text = await file.text();
        await restoreBackup(text);
        setMessage("백업을 복구했어요.");
        router.refresh();
      } catch (error) {
        setMessage(resolveRestoreErrorMessage(error));
      } finally {
        event.target.value = "";
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[1.8rem] border border-slate-200/70 bg-slate-50 px-5 py-5">
        <p className="text-sm leading-6 text-slate-500">
          가계부, 캘린더, 루틴, 만다라트, 아이콘 설정까지 한 번에 저장할 수 있어요.
        </p>
      </div>

      <div className="rounded-[1.8rem] border border-red-100 bg-red-50 px-5 py-5">
        <p className="text-sm font-semibold text-red-600">복구하면 현재 데이터가 바뀌어요.</p>
        <p className="mt-2 text-sm leading-6 text-red-500">
          복구 전에 먼저 백업 파일을 새로 받아 두는 편이 안전해요.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {disabled ? (
          <Button type="button" disabled variant="outline" className="w-full sm:w-auto">
            전체 백업 다운로드
          </Button>
        ) : (
          <a
            href="/api/backup"
            className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
          >
            전체 백업 다운로드
          </a>
        )}

        <input
          ref={inputRef}
          hidden
          accept="application/json,.json"
          type="file"
          onChange={(event) => {
            void handleFileChange(event);
          }}
        />

        <Button
          type="button"
          variant="destructive"
          disabled={disabled || isPending}
          onClick={() => inputRef.current?.click()}
        >
          {isPending ? "복구하고 있어요" : "백업 복구하기"}
        </Button>
      </div>

      {disabled ? (
        <p className="text-sm text-slate-400">지금 환경에서는 백업 파일을 준비할 수 없어요.</p>
      ) : null}

      {message ? <p className="text-sm text-slate-400">{message}</p> : null}
    </div>
  );
}
