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
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="rounded-3xl border bg-background/70 p-4">
        <div className="mb-4 space-y-1">
          <p className="text-sm font-semibold">Settings hub</p>
          <p className="text-sm text-muted-foreground">
            Preferences, backup, and admin tools live here.
          </p>
        </div>
        <SettingsNavigation isAdmin={session.user.role === "ADMIN"} />
      </aside>

      <div className="space-y-6">{children}</div>
    </div>
  );
}

