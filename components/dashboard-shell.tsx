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
    label: "Finance",
    shortLabel: "자산",
    description: "가계부와 자산 흐름",
    icon: PiggyBank,
  },
  {
    href: "/calendar",
    label: "Calendar",
    shortLabel: "캘린더",
    description: "통합 라이프 캘린더",
    icon: CalendarDays,
  },
  {
    href: "/todo-routine",
    label: "Todo & Routine",
    shortLabel: "루틴",
    description: "할 일과 루틴 관리",
    icon: CheckSquare,
  },
  {
    href: "/mandalart",
    label: "Mandalart",
    shortLabel: "목표",
    description: "만다라트 목표 보드",
    icon: Goal,
  },
  {
    href: "/analytics",
    label: "Analytics",
    shortLabel: "통계",
    description: "통합 분석과 통계",
    icon: BarChart3,
  },
  {
    href: "/settings",
    label: "Settings",
    shortLabel: "설정",
    description: "환경설정과 관리자 기능",
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
    <nav className="flex flex-col gap-2">
      {navigationItems.map(({ description, href, icon: Icon, label, shortLabel }) => {
        const active = isDashboardRouteActive(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "group flex min-h-11 items-center justify-between rounded-2xl border px-4 py-3 transition md:min-h-10",
              active
                ? "border-transparent bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                : "border-transparent bg-transparent hover:border-sidebar-border hover:bg-white/70",
            )}
          >
            <span className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-11 items-center justify-center rounded-2xl transition md:size-10",
                  active
                    ? "bg-white/16 text-sidebar-primary-foreground"
                    : "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{label}</span>
                <span
                  className={cn(
                    "text-xs",
                    active ? "text-sidebar-primary-foreground/75" : "text-muted-foreground",
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
    <nav className="safe-pb fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 px-2 pb-2 pt-2 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
        {navigationItems
          .filter((item) => mobilePrimaryRoutes.has(item.href))
          .map(({ href, icon: Icon, label }) => {
            const active = isDashboardRouteActive(pathname, href);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center rounded-2xl px-2 py-2 text-[0.7rem] font-medium transition",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
    <div className="relative min-h-[100dvh]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1600px] gap-6 px-3 py-3 sm:px-4 sm:py-4 lg:px-8">
        <aside className="glass-panel sticky top-4 hidden h-[calc(100dvh-2rem)] w-80 shrink-0 rounded-[2rem] border border-white/60 p-5 lg:flex lg:flex-col">
          <div className="space-y-4">
            <div className="space-y-3">
              <Badge variant="outline">LifeSync v1.2</Badge>
              <div className="space-y-1">
                <p className="font-heading text-3xl leading-none tracking-tight">LifeSync</p>
                <p className="text-sm text-muted-foreground">
                  Frictionless finance and life orchestration for a private dashboard.
                </p>
              </div>
            </div>
            <Separator />
            <SideNavigation pathname={pathname} />
          </div>
          <div className="mt-auto rounded-3xl bg-sidebar-primary/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Live Dashboard
            </p>
            <p className="mt-2 text-sm leading-6 text-foreground/80">
              Finance, planner, routine, mandalart, analytics, and settings are all connected
              through the same private workspace.
            </p>
          </div>
        </aside>

        <div className="flex min-h-[calc(100dvh-1.5rem)] flex-1 flex-col rounded-[1.75rem] border border-white/60 bg-white/70 shadow-[0_32px_80px_-48px_rgba(42,61,96,0.45)] backdrop-blur-xl sm:rounded-[2rem]">
          <header className="safe-pt flex flex-wrap items-start justify-between gap-3 border-b border-border/60 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Sheet>
                <SheetTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className="lg:hidden"
                      aria-label="Open navigation"
                    />
                  }
                >
                  <Menu className="size-4" />
                </SheetTrigger>
                <SheetContent side="left" className="w-full max-w-xs bg-sidebar">
                  <SheetHeader>
                    <SheetTitle>LifeSync</SheetTitle>
                    <SheetDescription>
                      Dashboard routes for finance, planning, routines, analytics, and admin.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="px-4 pb-6">
                    <SideNavigation pathname={pathname} />
                  </div>
                </SheetContent>
              </Sheet>

              <div className="min-w-0">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground sm:text-xs">
                  {activeMeta.description}
                </p>
                <h1 className="font-heading text-xl leading-tight tracking-tight sm:text-3xl">
                  {activeMeta.label}
                </h1>
              </div>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <Badge variant="outline">App Router</Badge>
              <Badge variant="outline">Tailwind v4</Badge>
              <Badge variant="outline">PWA Ready</Badge>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 pb-28 sm:px-6 sm:py-6 sm:pb-8 lg:px-8 lg:pb-8">
            <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground sm:mb-6">
              <span>Dashboard</span>
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
