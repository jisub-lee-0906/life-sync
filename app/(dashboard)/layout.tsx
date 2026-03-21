import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1720px] gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <AppSidebar />
        <div className="flex min-h-[calc(100vh-2rem)] flex-1 flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 shadow-lifesync backdrop-blur-xl">
          <AppHeader />
          <main className="flex-1 overflow-y-auto px-4 pb-24 pt-4 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
