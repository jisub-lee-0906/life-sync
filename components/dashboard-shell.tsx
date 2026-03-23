"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarDays,
  CheckSquare,
  Goal,
  PiggyBank,
  Settings,
} from "lucide-react";
import {
  getDashboardRouteMeta,
  getDashboardRoutes,
  isDashboardRouteActive,
} from "@/lib/dashboard-navigation";
import { cn } from "@/lib/utils";

type NavigationItem = {
  description: string;
  href: string;
  icon: LucideIcon;
  label: string;
};

const navigationItems: NavigationItem[] = [
  {
    description: "수입과 지출을 차분하게 정리해요",
    href: "/finance",
    icon: PiggyBank,
    label: "가계부",
  },
  {
    description: "한 달의 흐름을 가볍게 살펴봐요",
    href: "/calendar",
    icon: CalendarDays,
    label: "캘린더",
  },
  {
    description: "할 일과 루틴을 꾸준히 이어가요",
    href: "/todo-routine",
    icon: CheckSquare,
    label: "할 일·루틴",
  },
  {
    description: "중요한 목표를 한눈에 모아봐요",
    href: "/mandalart",
    icon: Goal,
    label: "만다라트",
  },
  {
    description: "이번 흐름을 숫자로 확인해요",
    href: "/analytics",
    icon: BarChart3,
    label: "분석",
  },
  {
    description: "설정과 데이터를 깔끔하게 관리해요",
    href: "/settings",
    icon: Settings,
    label: "설정",
  },
];

const mobilePrimaryRoutes = new Set(
  getDashboardRoutes()
    .filter((route) => route.mobilePrimary)
    .map((route) => route.href),
);

function SideNavigation({ pathname }: { pathname: string }) {
  return (
    <nav className="flex min-w-0 flex-col gap-2">
      {navigationItems.map(({ description, href, icon: Icon, label }) => {
        const active = isDashboardRouteActive(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "group flex min-w-0 items-center gap-3 rounded-[1.6rem] px-3 py-3 transition-all duration-200 xl:px-4",
              active ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-slate-100",
            )}
          >
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-2xl transition-all duration-200",
                active
                  ? "bg-white/16 text-primary-foreground"
                  : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-700",
              )}
            >
              <Icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{label}</span>
              <span
                className={cn(
                  "mt-1 hidden truncate text-xs xl:block",
                  active ? "text-primary-foreground/78" : "text-slate-400",
                )}
              >
                {description}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function MobileBottomNavigation({ pathname }: { pathname: string }) {
  return (
    <nav className="safe-pb fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 bg-white/96 px-3 pb-3 pt-2 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-5 gap-1.5">
        {navigationItems
          .filter((item) => mobilePrimaryRoutes.has(item.href))
          .map(({ href, icon: Icon, label }) => {
            const active = isDashboardRouteActive(pathname, href);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center rounded-2xl px-2 py-2 text-[0.72rem] font-semibold transition-all duration-200",
                  active ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-700",
                )}
              >
                <Icon className={cn("size-4", active ? "text-primary" : "")} />
                <span className="mt-1 leading-none">{label}</span>
              </Link>
            );
          })}
      </div>
    </nav>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeMeta = getDashboardRouteMeta(pathname);

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1600px] gap-3 px-3 py-3 sm:px-4 sm:py-4 lg:gap-5 lg:px-6 xl:px-8">
        <aside className="sticky top-4 hidden h-[calc(100dvh-2rem)] w-[248px] shrink-0 overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.04)] lg:flex lg:flex-col xl:w-[286px] xl:p-5">
          <div className="space-y-6">
            <div className="space-y-2 px-1">
              <p className="font-heading text-[1.65rem] font-semibold tracking-tight text-slate-900">
                LifeSync
              </p>
              <p className="hidden text-sm leading-6 text-slate-400 xl:block">
                필요한 정보만 조용하게 정리해요.
              </p>
            </div>
            <SideNavigation pathname={pathname} />
          </div>
        </aside>

        <div className="flex min-h-[calc(100dvh-1.5rem)] min-w-0 flex-1 flex-col rounded-[2rem] border border-slate-200/70 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.04)]">
          <header className="safe-pt flex min-h-[92px] items-center px-5 py-5 sm:min-h-[104px] sm:px-6 sm:py-6 lg:px-8">
            <div className="min-w-0">
              <h1 className="truncate font-heading text-[1.85rem] font-semibold tracking-tight text-slate-900 sm:text-[2.05rem]">
                {activeMeta.label}
              </h1>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 pb-28 pt-0 sm:px-6 sm:pb-8 sm:pt-1 lg:px-8 lg:pb-8 lg:pt-2">
            {children}
          </main>
        </div>
      </div>

      <MobileBottomNavigation pathname={pathname} />
    </div>
  );
}
