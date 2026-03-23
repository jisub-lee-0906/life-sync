import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveLoginRedirectTarget } from "@/lib/auth-redirect";

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const redirectTo = resolveLoginRedirectTarget(searchParams.callbackUrl);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md bg-[linear-gradient(180deg,#ffffff,#fbfdff)]">
        <CardHeader className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">
            LifeSync
          </p>
          <CardTitle>로그인</CardTitle>
          <CardDescription>
            구글 계정으로 로그인하고 오늘 필요한 기록부터 바로 시작해 보세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo });
            }}
          >
            <Button type="submit" className="w-full">
              구글로 계속하기
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
