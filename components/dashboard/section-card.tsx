import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Accent = "primary" | "mint" | "amber" | "blue";

const accentClassName: Record<Accent, string> = {
  primary: "bg-primary/10 text-primary",
  mint: "bg-[color:var(--lifesync-mint)]/25 text-foreground",
  amber: "bg-[color:var(--lifesync-amber)]/25 text-foreground",
  blue: "bg-[color:var(--lifesync-blue)]/15 text-foreground",
};

type SectionCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  children?: ReactNode;
  accent?: Accent;
  compact?: boolean;
  className?: string;
};

export function SectionCard({
  title,
  description,
  icon: Icon,
  children,
  accent = "primary",
  compact = false,
  className,
}: SectionCardProps) {
  return (
    <Card
      className={cn(
        "bg-lifesync-panel rounded-[1.8rem] border-white/80 shadow-none backdrop-blur",
        compact && "h-full",
        className
      )}
    >
      <CardHeader className={cn("gap-4", compact && "pb-4")}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="font-heading text-xl tracking-tight">
              {title}
            </CardTitle>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
              accentClassName[accent]
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      {children ? <CardContent>{children}</CardContent> : null}
    </Card>
  );
}
