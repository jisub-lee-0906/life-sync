import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { approveUser, rejectUser } from "@/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db, hasDatabaseUrl } from "@/lib/db";

export const dynamic = "force-dynamic";

const userStatusLabel = {
  APPROVED: "승인",
  PENDING: "대기",
  REJECTED: "거절",
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
    <Card>
      <CardHeader>
        <CardTitle>가입 요청 관리</CardTitle>
        <CardDescription>새로 들어온 계정을 확인하고 바로 승인하거나 거절할 수 있어요.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasDatabaseUrl ? (
          <p className="text-sm text-slate-400">지금 환경에서는 가입 대기 목록을 불러올 수 없어요.</p>
        ) : pendingUsers.length === 0 ? (
          <div className="rounded-[1.8rem] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
            <p className="text-base font-semibold text-slate-700">지금은 확인할 요청이 없어요.</p>
            <p className="mt-2 text-sm text-slate-400">새 요청이 들어오면 여기에서 바로 처리할 수 있어요.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="flex flex-col gap-4 rounded-[1.8rem] border border-slate-200/70 bg-slate-50 p-5 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{user.name}</p>
                    <Badge>{userStatusLabel[user.status as keyof typeof userStatusLabel] ?? user.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{user.email}</p>
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
  );
}
