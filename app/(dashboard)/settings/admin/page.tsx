import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { approveUser, rejectUser } from "@/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db, hasDatabaseUrl } from "@/lib/db";

export const dynamic = "force-dynamic";

const userStatusLabel = {
  APPROVED: "승인됨",
  PENDING: "승인 대기",
  REJECTED: "거절됨",
} as const;

export default async function SettingsAdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/finance");
  }

  const pendingUsers = hasDatabaseUrl
    ? await db.query.users.findMany({
        orderBy: (table, { asc }) => [asc(table.createdAt)],
        where: (table, { eq }) => eq(table.status, "PENDING"),
      })
    : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>가입 요청 관리</CardTitle>
          <CardDescription>
            새로 가입한 사용자를 확인하고 상태를 바로 바꿀 수 있어요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasDatabaseUrl ? (
            <p className="text-sm text-muted-foreground">
              지금 환경에서는 가입 대기 목록을 불러올 수 없어요.
            </p>
          ) : pendingUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              지금은 승인 대기 중인 사용자가 없어요.
            </p>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-3 rounded-3xl bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800">{user.name}</p>
                      <Badge variant="outline">
                        {userStatusLabel[user.status as keyof typeof userStatusLabel] ?? user.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <form
                      action={async () => {
                        "use server";
                        await approveUser(user.id);
                      }}
                    >
                      <Button type="submit">승인</Button>
                    </form>
                    <form
                      action={async () => {
                        "use server";
                        await rejectUser(user.id);
                      }}
                    >
                      <Button type="submit" variant="outline">
                        거절
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
