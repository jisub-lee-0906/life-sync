"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { navigationItems } from "@/lib/navigation";

type NavLinksProps = {
  mobile?: boolean;
};

export function NavLinks({ mobile = false }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("grid gap-2", mobile && "gap-3")}>
      {navigationItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-[1.35rem] border px-4 py-3 transition-all",
              isActive
                ? "border-primary/20 bg-primary/10 text-primary shadow-sm"
                : "border-transparent bg-transparent text-muted-foreground hover:border-white/80 hover:bg-white/80 hover:text-foreground"
            )}
          >
            <NavIcon icon={item.icon} active={isActive} />
            <div className="min-w-0">
              <p className="font-medium">{item.label}</p>
              <p className="truncate text-xs text-muted-foreground">
                {item.description}
              </p>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

function NavIcon({
  icon: Icon,
  active,
}: {
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-colors",
        active ? "bg-white text-primary" : "bg-secondary text-secondary-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}
