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
          <CardTitle>Admin approvals</CardTitle>
          <CardDescription>
            Review newly registered users and update their access status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasDatabaseUrl ? (
            <p className="text-sm text-muted-foreground">
              DATABASE_URL is not configured yet, so pending users cannot be loaded in this environment.
            </p>
          ) : pendingUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending users right now.</p>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.name}</p>
                      <Badge variant="outline">{user.status}</Badge>
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
                      <Button type="submit">Approve</Button>
                    </form>
                    <form
                      action={async () => {
                        "use server";
                        await rejectUser(user.id);
                      }}
                    >
                      <Button type="submit" variant="outline">
                        Reject
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
