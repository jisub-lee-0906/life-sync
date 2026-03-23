"use client";

import { type ChangeEvent, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { restoreBackup } from "@/actions/settings";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DataBackupPanelProps = {
  disabled?: boolean;
};

export function DataBackupPanel({ disabled }: DataBackupPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const confirmed = window.confirm(
      "복구를 진행하면 현재 데이터가 모두 백업 파일 내용으로 바뀌어요. 계속할까요?",
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
        setMessage(error instanceof Error ? error.message : "백업을 복구하지 못했어요.");
      } finally {
        event.target.value = "";
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        가계부, 캘린더, 루틴, 만다라트, 아이콘 설정까지 한 번에 백업할 수 있어요.
      </p>
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
          accept="application/json"
          type="file"
          onChange={(event) => {
            void handleFileChange(event);
          }}
        />
        <Button
          type="button"
          disabled={disabled || isPending}
          onClick={() => inputRef.current?.click()}
        >
          {isPending ? "복구하고 있어요" : "백업 복구하기"}
        </Button>
      </div>
      {disabled ? (
        <p className="text-sm text-muted-foreground">
          지금 환경에서는 백업 데이터를 준비할 수 없어요.
        </p>
      ) : null}
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
