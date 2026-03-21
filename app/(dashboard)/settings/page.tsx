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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <IconPreferencesForm initialValues={initialValues} />
        </CardContent>
      </Card>

      <Card id="data-backup">
        <CardHeader>
          <CardTitle>Data & Backup</CardTitle>
        </CardHeader>
        <CardContent>
          <DataBackupPanel disabled={!hasDatabaseUrl} />
        </CardContent>
      </Card>
    </div>
  );
}

