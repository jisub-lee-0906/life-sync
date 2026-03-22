import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signIn } from "@/auth";
import { resolveLoginRedirectTarget } from "@/lib/auth-redirect";

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const redirectTo = resolveLoginRedirectTarget(searchParams.callbackUrl);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>로그인</CardTitle>
          <CardDescription>
            구글 계정으로 로그인하고 LifeSync를 바로 시작해 보세요.
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
