"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isSettingsNavigationItemActive } from "@/lib/settings-navigation";
import { cn } from "@/lib/utils";

type SettingsNavigationProps = {
  isAdmin: boolean;
};

const baseItems = [
  {
    description: "아이콘과 기본 취향을 바꿔요.",
    href: "/settings",
    label: "기본 설정",
  },
  {
    description: "내 데이터를 파일로 저장하거나 복구해요.",
    href: "/settings/backup",
    label: "백업",
  },
];

export function SettingsNavigation({ isAdmin }: SettingsNavigationProps) {
  const pathname = usePathname();
  const items = isAdmin
    ? [
        ...baseItems,
        {
          description: "가입 요청을 확인하고 처리해요.",
          href: "/settings/admin",
          label: "관리",
        },
      ]
    : baseItems;

  return (
    <nav className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
      {items.map((item) => {
        const active = isSettingsNavigationItemActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-h-11 flex-col justify-center rounded-2xl border border-slate-200/70 bg-white px-4 py-3.5 shadow-sm transition-all duration-200",
              active
                ? "border-transparent bg-sidebar-primary text-sidebar-primary-foreground"
                : "hover:border-slate-300/70 hover:bg-slate-50",
            )}
          >
            <p className="text-sm font-semibold">{item.label}</p>
            <p
              className={cn(
                "mt-1 text-xs leading-5",
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
