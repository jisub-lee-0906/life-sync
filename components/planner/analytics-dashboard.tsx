"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ExpenseCategoryDatum, TaskCompletionDatum } from "@/lib/planner";

const palette = ["#0040FF", "#5AA6FF", "#28C76F", "#FFB020", "#8B5CF6", "#0EA5E9"];

export function AnalyticsDashboard({
  expenseByCategory,
  taskCompletion,
}: {
  expenseByCategory: ExpenseCategoryDatum[];
  taskCompletion: TaskCompletionDatum;
}) {
  const taskCompletionData = [
    { name: "완료", value: taskCompletion.completedCount },
    { name: "진행 중", value: taskCompletion.inProgressCount },
  ].filter((entry) => entry.value > 0);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-6">
      <Card>
        <CardHeader>
          <CardTitle>지출 분석</CardTitle>
          <CardDescription>
            이번 달 어디에 가장 많이 쓰고 있는지 한눈에 볼 수 있어요.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-72 sm:h-80">
          {expenseByCategory.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              이번 달 지출이 아직 없어요.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  innerRadius={70}
                  outerRadius={110}
                  dataKey="value"
                  nameKey="name"
                >
                  {expenseByCategory.map((entry, index) => (
                    <Cell key={entry.name} fill={palette[index % palette.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `${Number(value ?? 0).toLocaleString("ko-KR")}원`}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>할 일 달성률</CardTitle>
          <CardDescription>
            완료한 일과 진행 중인 일을 가볍게 비교해 보세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-72 sm:h-80">
            {taskCompletion.totalCount === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                이번 달 할 일이 아직 없어요.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskCompletionData}
                    innerRadius={70}
                    outerRadius={110}
                    dataKey="value"
                    nameKey="name"
                  >
                    {taskCompletionData.map((entry, index) => (
                      <Cell key={entry.name} fill={palette[index % palette.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `${Number(value ?? 0).toLocaleString("ko-KR")}개`}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm text-muted-foreground">달성률</p>
              <p className="mt-2 text-2xl font-semibold text-slate-800">
                {taskCompletion.completionRate}%
              </p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm text-muted-foreground">완료</p>
              <p className="mt-2 text-2xl font-semibold text-slate-800">
                {taskCompletion.completedCount}개
              </p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm text-muted-foreground">진행 중</p>
              <p className="mt-2 text-2xl font-semibold text-slate-800">
                {taskCompletion.inProgressCount}개
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
