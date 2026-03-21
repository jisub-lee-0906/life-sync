"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type SettingsNavigationProps = {
  isAdmin: boolean;
};

const baseItems = [
  {
    description: "Customize planner and todo icons.",
    href: "/settings",
    label: "Preferences",
  },
  {
    description: "Download a full JSON backup.",
    href: "/settings#data-backup",
    label: "Data & Backup",
  },
];

export function SettingsNavigation({ isAdmin }: SettingsNavigationProps) {
  const pathname = usePathname();
  const items = isAdmin
    ? [
        ...baseItems,
        {
          description: "Review pending user approvals.",
          href: "/settings/admin",
          label: "Admin",
        },
      ]
    : baseItems;

  return (
    <nav className="space-y-2">
      {items.map((item) => {
        const active =
          item.href === "/settings#data-backup"
            ? pathname === "/settings"
            : pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-2xl border px-4 py-3 transition",
              active
                ? "border-transparent bg-sidebar-primary text-sidebar-primary-foreground"
                : "hover:border-border hover:bg-muted/40",
            )}
          >
            <p className="text-sm font-semibold">{item.label}</p>
            <p
              className={cn(
                "mt-1 text-xs",
                active ? "text-sidebar-primary-foreground/80" : "text-muted-foreground",
              )}
            >
              {item.description}
            </p>
          </Link>
        );
      })}
    </nav>
  );
}

