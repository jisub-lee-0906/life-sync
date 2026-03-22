"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExpenseCategoryDatum, TaskCompletionDatum } from "@/lib/planner";

const palette = ["#335CFF", "#4DB6AC", "#FFB020", "#E76F51", "#8E7DBE", "#5A6B7B"];

export function AnalyticsDashboard({
  expenseByCategory,
  taskCompletion,
}: {
  expenseByCategory: ExpenseCategoryDatum[];
  taskCompletion: TaskCompletionDatum;
}) {
  const taskCompletionData = [
    { name: "Completed", value: taskCompletion.completedCount },
    { name: "In Progress", value: taskCompletion.inProgressCount },
  ].filter((entry) => entry.value > 0);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Expense by category</CardTitle>
          <CardDescription>Current month expense distribution.</CardDescription>
        </CardHeader>
        <CardContent className="h-72 sm:h-80">
          {expenseByCategory.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No expense data for this month.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={expenseByCategory} innerRadius={70} outerRadius={110} dataKey="value" nameKey="name">
                  {expenseByCategory.map((entry, index) => (
                    <Cell key={entry.name} fill={palette[index % palette.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) =>
                    `${Number(value ?? 0).toLocaleString("ko-KR")}원`
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Task completion</CardTitle>
          <CardDescription>Current month completion rate.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-72 sm:h-80">
            {taskCompletion.totalCount === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No task data for this month.
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
                    formatter={(value) => `${Number(value ?? 0).toLocaleString("ko-KR")} tasks`}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border p-4">
              <p className="text-sm text-muted-foreground">Completion rate</p>
              <p className="mt-2 text-2xl font-semibold">{taskCompletion.completionRate}%</p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="mt-2 text-2xl font-semibold">{taskCompletion.completedCount}</p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-sm text-muted-foreground">In progress</p>
              <p className="mt-2 text-2xl font-semibold">{taskCompletion.inProgressCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
