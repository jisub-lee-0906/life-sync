import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SettingsNavigation } from "@/components/settings/settings-navigation";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6">
      <aside className="rounded-3xl bg-slate-50 p-4">
        <div className="mb-4 space-y-1">
          <p className="text-sm font-semibold">설정</p>
          <p className="text-sm text-muted-foreground">
            취향 설정과 백업, 관리 기능을 모아뒀어요.
          </p>
        </div>
        <SettingsNavigation isAdmin={session.user.role === "ADMIN"} />
      </aside>

      <div className="space-y-5 sm:space-y-6">{children}</div>
    </div>
  );
}
