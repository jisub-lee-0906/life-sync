import { cn } from "@/lib/utils";

type AppLogoProps = {
  className?: string;
};

export function AppLogo({ className }: AppLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative flex h-11 w-11 items-center justify-center rounded-[1.35rem] bg-primary text-primary-foreground shadow-sm">
        <span className="font-heading text-lg font-bold tracking-tight">LS</span>
        <div className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-[var(--lifesync-mint)]" />
      </div>
      <div>
        <p className="font-heading text-base font-bold tracking-tight">LifeSync</p>
        <p className="text-xs text-muted-foreground">Asset & Life OS</p>
      </div>
    </div>
  );
}
