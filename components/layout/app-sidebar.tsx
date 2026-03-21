import { AppLogo } from "@/components/branding/app-logo";
import { NavLinks } from "@/components/navigation/nav-links";
import { Separator } from "@/components/ui/separator";

export function AppSidebar() {
  return (
    <aside className="bg-lifesync-panel shadow-lifesync sticky top-4 hidden h-[calc(100vh-2rem)] w-[280px] shrink-0 rounded-[2rem] border border-white/70 p-5 backdrop-blur xl:flex xl:flex-col">
      <AppLogo />
      <Separator className="my-5" />
      <div className="flex-1">
        <NavLinks />
      </div>
      <div className="rounded-[1.6rem] border border-white/70 bg-white/90 p-4">
        <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
          다음 단계 준비
        </p>
        <p className="mt-2 font-heading text-lg font-semibold tracking-tight">
          Step 2 스키마 작성 예정
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          User, Transaction, Task, Routine, Mandalart, Settings 모델을 여기에
          연결할 기반이 준비되어 있습니다.
        </p>
      </div>
    </aside>
  );
}
