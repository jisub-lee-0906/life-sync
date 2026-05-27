import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DeniedPage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md bg-[linear-gradient(180deg,#ffffff,#fbfdff)]">
        <CardHeader>
          <CardTitle>접근 권한이 없어요</CardTitle>
          <CardDescription>
            현재 계정은 아직 승인되지 않았어요. 필요하면 관리자에게 확인을 요청해 주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-slate-400">
            안내가 잘못된 것 같다면 권한 상태를 먼저 다시 확인해 보세요.
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
