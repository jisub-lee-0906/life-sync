import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PendingPage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md bg-[linear-gradient(180deg,#ffffff,#fbfdff)]">
        <CardHeader>
          <CardTitle>승인을 기다리고 있어요</CardTitle>
          <CardDescription>
            관리자 확인이 끝나면 바로 사용할 수 있어요. 잠시 후 다시 들어와 보세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-slate-400">
            상태는 다시 로그인하면 바로 확인할 수 있어요.
          </p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button type="submit" variant="outline" className="w-full">
              로그아웃
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
