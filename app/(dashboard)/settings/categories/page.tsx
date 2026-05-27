import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTransactionCategories } from "@/actions/finance";
import { TransactionCategoriesPanel } from "@/components/settings/transaction-categories-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function SettingsCategoriesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const initialCategories = await getTransactionCategories(true);

  return (
    <Card>
      <CardHeader>
        <CardTitle>분류 관리</CardTitle>
        <CardDescription>수입과 지출 분류를 정리하고 입력 폼과 집계 기준에 바로 반영할 수 있어요.</CardDescription>
      </CardHeader>
      <CardContent>
        <TransactionCategoriesPanel initialCategories={initialCategories} />
      </CardContent>
    </Card>
  );
}
