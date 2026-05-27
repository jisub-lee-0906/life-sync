import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataBackupPanel } from "@/components/settings/data-backup-panel";
import { hasDatabaseUrl } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SettingsBackupPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>데이터 백업</CardTitle>
        <CardDescription>지금까지 쌓은 기록을 파일로 저장하거나 다시 복구할 수 있어요.</CardDescription>
      </CardHeader>
      <CardContent>
        <DataBackupPanel disabled={!hasDatabaseUrl} />
      </CardContent>
    </Card>
  );
}
