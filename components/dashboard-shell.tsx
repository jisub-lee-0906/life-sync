"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  Goal,
  Menu,
  PiggyBank,
  Settings,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  shortLabel: string;
};

const navigationItems: NavigationItem[] = [
  {
    href: "/finance",
    label: "가계부",
    shortLabel: "가계부",
    description: "수입과 지출을 빠르게 정리해요",
    icon: PiggyBank,
  },
  {
    href: "/calendar",
    label: "캘린더",
    shortLabel: "캘린더",
    description: "오늘 일정과 내역을 함께 봐요",
    icon: CalendarDays,
  },
  {
    href: "/todo-routine",
    label: "할 일·루틴",
    shortLabel: "할 일",
    description: "할 일과 루틴을 가볍게 관리해요",
    icon: CheckSquare,
  },
  {
    href: "/mandalart",
    label: "만다라트",
    shortLabel: "목표",
    description: "중요한 목표를 한눈에 모아봐요",
    icon: Goal,
  },
  {
    href: "/analytics",
    label: "분석",
    shortLabel: "분석",
    description: "지출과 달성률 흐름을 확인해요",
    icon: BarChart3,
  },
  {
    href: "/settings",
    label: "설정",
    shortLabel: "설정",
    description: "아이콘, 백업, 관리 기능을 모아뒀어요",
    icon: Settings,
  },
];

const mobilePrimaryRoutes = new Set(
  getDashboardRoutes()
    .filter((route) => route.mobilePrimary)
    .map((route) => route.href),
);

function SideNavigation({
  onNavigate,
  pathname,
}: {
  onNavigate?: () => void;
  pathname: string;
}) {
  return (
    <nav className="flex flex-col gap-3">
      {navigationItems.map(({ description, href, icon: Icon, label, shortLabel }) => {
        const active = isDashboardRouteActive(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "group flex min-h-11 items-center justify-between rounded-3xl border border-transparent bg-white px-4 py-3 shadow-sm transition-all duration-200 md:min-h-10",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "hover:border-sidebar-border hover:bg-slate-50",
            )}
          >
            <span className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-11 items-center justify-center rounded-2xl transition-all duration-200 md:size-10",
                  active
                    ? "bg-white/18 text-sidebar-primary-foreground"
                    : "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{label}</span>
                <span
                  className={cn(
                    "text-xs leading-5",
                    active ? "text-sidebar-primary-foreground/80" : "text-muted-foreground",
                  )}
                >
                  {description}
                </span>
              </span>
            </span>
            <Badge variant={active ? "secondary" : "outline"}>{shortLabel}</Badge>
          </Link>
        );
      })}
    </nav>
  );
}

function MobileBottomNavigation({ pathname }: { pathname: string }) {
  return (
    <nav className="safe-pb fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-3 pb-3 pt-2 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-5 gap-2">
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
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-slate-50 hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
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
    <div className="relative min-h-[100dvh] bg-slate-50">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1600px] gap-6 px-3 py-3 sm:px-4 sm:py-4 lg:px-8">
        <aside className="sticky top-4 hidden h-[calc(100dvh-2rem)] w-80 shrink-0 rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm lg:flex lg:flex-col">
          <div className="space-y-5">
            <div className="space-y-3">
              <Badge variant="outline">LifeSync v1.2</Badge>
              <div className="space-y-1.5">
                <p className="font-heading text-3xl leading-none tracking-tight text-slate-800">
                  LifeSync
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  돈과 일정, 루틴과 목표를 한 흐름으로 정리해요.
                </p>
              </div>
            </div>
            <Separator />
            <SideNavigation pathname={pathname} />
          </div>
          <div className="mt-auto rounded-3xl bg-slate-50 p-5">
            <p className="text-xs font-semibold tracking-[0.08em] text-primary">오늘의 포인트</p>
            <p className="mt-2 text-sm leading-6 text-foreground/80">
              자주 보는 정보만 또렷하게 보여주도록 화면을 가볍게 정리했어요.
            </p>
          </div>
        </aside>

        <div className="flex min-h-[calc(100dvh-1.5rem)] flex-1 flex-col rounded-[2rem] border border-slate-200/80 bg-white shadow-sm">
          <header className="safe-pt flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/80 px-5 py-5 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Sheet>
                <SheetTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className="lg:hidden"
                      aria-label="메뉴 열기"
                    />
                  }
                >
                  <Menu className="size-4" />
                </SheetTrigger>
                <SheetContent side="left" className="w-full max-w-xs bg-sidebar">
                  <SheetHeader>
                    <SheetTitle>LifeSync</SheetTitle>
                    <SheetDescription>필요한 메뉴를 골라 바로 이동해 보세요.</SheetDescription>
                  </SheetHeader>
                  <div className="px-4 pb-6">
                    <SideNavigation pathname={pathname} />
                  </div>
                </SheetContent>
              </Sheet>

              <div className="min-w-0">
                <p className="text-[0.75rem] font-semibold tracking-[0.08em] text-primary sm:text-xs">
                  {activeMeta.description}
                </p>
                <h1 className="font-heading text-2xl leading-tight tracking-tight text-slate-800 sm:text-3xl">
                  {activeMeta.label}
                </h1>
              </div>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <Badge variant="outline">빠르게</Badge>
              <Badge variant="outline">가볍게</Badge>
              <Badge variant="outline">깔끔하게</Badge>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 pb-28 sm:px-6 sm:py-7 sm:pb-8 lg:px-8 lg:pb-8">
            <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground sm:mb-6">
              <span>홈</span>
              <ChevronRight className="size-4" />
              <span>{activeMeta.label}</span>
            </div>
            {children}
          </main>
        </div>
      </div>
      <MobileBottomNavigation pathname={pathname} />
    </div>
  );
}
