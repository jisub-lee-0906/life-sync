import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataBackupPanel } from "@/components/settings/data-backup-panel";
import { hasDatabaseUrl } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SettingsBackupPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <Card>
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
