"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExpenseCategoryDatum, TaskCompletionDatum } from "@/lib/planner";

const palette = ["#0040FF", "#60A5FA", "#22C55E", "#F59E0B", "#A855F7", "#0EA5E9"];

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
    <div className="space-y-5 sm:space-y-6">
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-200/70 bg-white px-6 py-6 shadow-sm">
          <p className="text-sm text-slate-400">완료율</p>
          <p className="mt-3 text-[2rem] font-semibold tracking-tight text-slate-900">
            {taskCompletion.completionRate}%
          </p>
        </div>
        <div className="rounded-[2rem] border border-slate-200/70 bg-white px-6 py-6 shadow-sm">
          <p className="text-sm text-slate-400">완료한 할 일</p>
          <p className="mt-3 text-[2rem] font-semibold tracking-tight text-slate-900">
            {taskCompletion.completedCount.toLocaleString("ko-KR")}개
          </p>
        </div>
        <div className="rounded-[2rem] border border-slate-200/70 bg-white px-6 py-6 shadow-sm">
          <p className="text-sm text-slate-400">진행 중</p>
          <p className="mt-3 text-[2rem] font-semibold tracking-tight text-slate-900">
            {taskCompletion.inProgressCount.toLocaleString("ko-KR")}개
          </p>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>지출 구성</CardTitle>
            <CardDescription>어디에 가장 많이 쓰고 있는지 빠르게 읽을 수 있어요.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {expenseByCategory.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                아직 이번 달 지출이 없어요.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    innerRadius={74}
                    outerRadius={114}
                    dataKey="value"
                    nameKey="name"
                  >
                    {expenseByCategory.map((entry, index) => (
                      <Cell key={entry.name} fill={palette[index % palette.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${Number(value ?? 0).toLocaleString("ko-KR")}원`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>할 일 흐름</CardTitle>
            <CardDescription>완료와 진행 중 비중을 차분하게 비교해 볼 수 있어요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-72">
              {taskCompletion.totalCount === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  아직 이번 달 할 일이 없어요.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskCompletionData}
                      innerRadius={74}
                      outerRadius={114}
                      dataKey="value"
                      nameKey="name"
                    >
                      {taskCompletionData.map((entry, index) => (
                        <Cell key={entry.name} fill={palette[index % palette.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${Number(value ?? 0).toLocaleString("ko-KR")}개`} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.6rem] bg-slate-50 px-5 py-5">
                <p className="text-sm text-slate-400">전체 할 일</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {taskCompletion.totalCount.toLocaleString("ko-KR")}개
                </p>
              </div>
              <div className="rounded-[1.6rem] bg-slate-50 px-5 py-5">
                <p className="text-sm text-slate-400">집중도</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {taskCompletion.completionRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
