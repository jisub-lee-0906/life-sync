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
    description: "아이콘과 기본 취향을 정리해요.",
    href: "/settings",
    label: "기본 설정",
  },
  {
    description: "수입과 지출 분류를 관리해요.",
    href: "/settings/categories",
    label: "분류 관리",
  },
  {
    description: "백업 파일을 저장하거나 복구해요.",
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
          description: "가입 요청을 검토하고 처리해요.",
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
              "rounded-[1.5rem] border px-4 py-4 shadow-sm transition-all duration-200",
              active
                ? "border-primary bg-blue-50 text-slate-900"
                : "border-slate-200/70 bg-white hover:border-slate-300 hover:bg-slate-50",
            )}
          >
            <p className="text-sm font-semibold">{item.label}</p>
            <p className={cn("mt-1 text-xs leading-5", active ? "text-slate-500" : "text-slate-400")}>
              {item.description}
            </p>
          </Link>
        );
      })}
    </nav>
  );
}
