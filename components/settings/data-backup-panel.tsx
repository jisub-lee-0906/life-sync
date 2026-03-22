"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DataBackupPanelProps = {
  disabled?: boolean;
};

export function DataBackupPanel({ disabled }: DataBackupPanelProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        가계부, 캘린더, 루틴, 만다라트, 아이콘 설정까지 한 번에 백업할 수 있어요.
      </p>
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
      {disabled ? (
        <p className="text-sm text-muted-foreground">
          지금 환경에서는 백업 데이터를 준비할 수 없어요.
        </p>
      ) : null}
    </div>
  );
}
