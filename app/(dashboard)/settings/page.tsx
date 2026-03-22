import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataBackupPanel } from "@/components/settings/data-backup-panel";
import { IconPreferencesForm } from "@/components/settings/icon-preferences-form";
import { db, hasDatabaseUrl } from "@/lib/db";
import { resolveIconPreferences } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const currentSettings =
    hasDatabaseUrl
      ? await db.query.settings.findFirst({
          columns: {
            scheduleIcon: true,
            todoIcon: true,
          },
          where: (table, { eq }) => eq(table.userId, session.user.id),
        })
      : null;

  const initialValues = resolveIconPreferences(currentSettings);

  return (
    <div className="space-y-5 sm:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>기본 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <IconPreferencesForm initialValues={initialValues} />
        </CardContent>
      </Card>

      <Card id="data-backup">
        <CardHeader>
          <CardTitle>데이터 백업</CardTitle>
        </CardHeader>
        <CardContent>
          <DataBackupPanel disabled={!hasDatabaseUrl} />
        </CardContent>
      </Card>
    </div>
  );
}
