"use client";

import { Bell, Search, Settings2 } from "lucide-react";
import { AppLogo } from "@/components/branding/app-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/70 bg-white/75 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="md:hidden">
            <AppLogo className="sm:hidden" />
          </div>
          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
              Private dashboard
            </p>
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              LifeSync v1.2
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-white/80 bg-white/85 px-4 py-2 text-sm text-muted-foreground shadow-sm md:flex">
            <Search className="h-4 w-4" />
            Quick Search는 Step 5 이후 연결됩니다
          </div>
          <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">
            PWA Ready
          </Badge>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
            <span className="sr-only">알림</span>
          </Button>
          <Button variant="ghost" size="icon">
            <Settings2 className="h-5 w-5" />
            <span className="sr-only">설정</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
