"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExpenseCategoryDatum, TaskCompletionDatum } from "@/lib/planner";

const palette = ["#0040FF", "#60A5FA", "#22C55E", "#F59E0B", "#A855F7", "#0EA5E9"];

function ChartLegend({
  items,
  suffix,
}: {
  items: Array<{ name: string; value: number }>;
  suffix: string;
}) {
  return (
    <div className="grid gap-2.5">
      {items.map((item, index) => (
        <div
          key={item.name}
          className="flex items-center justify-between rounded-[1.4rem] bg-slate-50 px-4 py-3"
        >
          <div className="flex items-center gap-2.5">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: palette[index % palette.length] }}
            />
            <span className="text-sm font-medium text-slate-700">{item.name}</span>
          </div>
          <span className="text-sm font-semibold text-slate-900">
            {item.value.toLocaleString("ko-KR")}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  );
}

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
            <CardDescription>
              어디에 가장 많이 쓰고 있는지 빠르게 읽을 수 있어요.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:items-center">
            {expenseByCategory.length === 0 ? (
              <div className="flex min-h-72 items-center justify-center text-sm text-slate-400">
                아직 이번 달 지출이 없어요.
              </div>
            ) : (
              <>
                <div className="mx-auto aspect-square w-full max-w-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        animationDuration={650}
                        animationEasing="ease-out"
                        cx="50%"
                        cy="50%"
                        data={expenseByCategory}
                        dataKey="value"
                        innerRadius="58%"
                        nameKey="name"
                        outerRadius="86%"
                        paddingAngle={2}
                        stroke="#FFFFFF"
                        strokeWidth={5}
                      >
                        {expenseByCategory.map((entry, index) => (
                          <Cell key={entry.name} fill={palette[index % palette.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => `${Number(value ?? 0).toLocaleString("ko-KR")}원`}
                        contentStyle={{
                          border: "1px solid rgba(226,232,240,0.9)",
                          borderRadius: "16px",
                          boxShadow: "0 16px 36px rgba(15,23,42,0.08)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ChartLegend items={expenseByCategory} suffix="원" />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>할 일 흐름</CardTitle>
            <CardDescription>
              완료와 진행 중 비중을 차분하게 비교해 볼 수 있어요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] lg:items-center">
              {taskCompletion.totalCount === 0 ? (
                <div className="flex min-h-72 items-center justify-center text-sm text-slate-400">
                  아직 이번 달 할 일이 없어요.
                </div>
              ) : (
                <>
                  <div className="mx-auto aspect-square w-full max-w-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          animationDuration={650}
                          animationEasing="ease-out"
                          cx="50%"
                          cy="50%"
                          data={taskCompletionData}
                          dataKey="value"
                          innerRadius="58%"
                          nameKey="name"
                          outerRadius="86%"
                          paddingAngle={2}
                          stroke="#FFFFFF"
                          strokeWidth={5}
                        >
                          {taskCompletionData.map((entry, index) => (
                            <Cell key={entry.name} fill={palette[index % palette.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => `${Number(value ?? 0).toLocaleString("ko-KR")}개`}
                          contentStyle={{
                            border: "1px solid rgba(226,232,240,0.9)",
                            borderRadius: "16px",
                            boxShadow: "0 16px 36px rgba(15,23,42,0.08)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ChartLegend items={taskCompletionData} suffix="개" />
                </>
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
