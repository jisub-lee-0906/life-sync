import Link from "next/link";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="bg-lifesync-panel shadow-lifesync w-full max-w-lg rounded-[2rem] border border-white/70 p-8 text-center backdrop-blur">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <WifiOff className="h-6 w-6" />
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          오프라인 상태예요
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          LifeSync는 연결이 복구되면 최신 데이터를 다시 동기화합니다. 지금은
          마지막으로 저장된 화면만 일부 확인할 수 있습니다.
        </p>
        <Link
          href="/finance"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          대시보드로 돌아가기
        </Link>
      </div>
    </main>
  );
}
