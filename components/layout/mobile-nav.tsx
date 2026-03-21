"use client";

import { Menu } from "lucide-react";
import { AppLogo } from "@/components/branding/app-logo";
import { NavLinks } from "@/components/navigation/nav-links";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileNav() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/70 bg-white/85 px-4 py-3 backdrop-blur xl:hidden">
      <div className="mx-auto flex max-w-[1720px] items-center justify-between gap-3">
        <AppLogo className="min-w-0" />
        <Sheet>
          <SheetTrigger render={<Button size="lg" className="rounded-full px-5" />}>
            <Menu className="h-5 w-5" />
            메뉴
          </SheetTrigger>
          <SheetContent className="w-[88vw] max-w-sm border-white/80 bg-white/95" side="left">
            <SheetHeader className="px-0">
              <SheetTitle>LifeSync 탐색</SheetTitle>
              <SheetDescription>
                Step 1에서 준비된 6개 탭 골격을 모바일에서도 동일하게 이동할 수
                있습니다.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <NavLinks mobile />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
