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
        Download your full LifeSync dataset as JSON, including finance, planner,
        routines, mandalart, and saved icon preferences.
      </p>
      {disabled ? (
        <Button type="button" disabled variant="outline" className="w-full sm:w-auto">
          Download full backup
        </Button>
      ) : (
        <a
          href="/api/backup"
          className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
        >
          Download full backup
        </a>
      )}
      {disabled ? (
        <p className="text-sm text-muted-foreground">
          DATABASE_URL is not configured in this environment, so backup export is unavailable.
        </p>
      ) : null}
    </div>
  );
}
