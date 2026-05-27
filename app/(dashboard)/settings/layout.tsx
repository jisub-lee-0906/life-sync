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
    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6">
      <aside className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-sm">
        <div className="mb-5 space-y-2">
          <p className="text-sm font-semibold text-slate-900">설정</p>
          <p className="text-sm leading-6 text-slate-400">
            기본 설정과 데이터 관리, 관리자 기능을 한곳에서 정리할 수 있어요.
          </p>
        </div>
        <SettingsNavigation isAdmin={session.user.role === "ADMIN"} />
      </aside>

      <div className="space-y-5 sm:space-y-6">{children}</div>
    </div>
  );
}
