"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isSettingsNavigationItemActive } from "@/lib/settings-navigation";
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
  const [hash, setHash] = useState("");
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

  useEffect(() => {
    const syncHash = () => {
      setHash(window.location.hash);
    };

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => {
      window.removeEventListener("hashchange", syncHash);
    };
  }, []);

  return (
    <nav className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
      {items.map((item) => {
        const active = isSettingsNavigationItemActive(pathname, hash, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block min-h-11 rounded-2xl border px-4 py-3 transition",
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
