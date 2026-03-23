import { getRoutineOverview, getTaskOverview } from "@/actions/planner";
import { RoutineTracker } from "@/components/planner/routine-tracker";
import { TaskProgressPanel } from "@/components/planner/task-progress-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function TodoRoutinePage() {
  const [routines, tasks] = await Promise.all([
    getRoutineOverview(),
    getTaskOverview(),
  ]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-6">
      <Card>
        <CardHeader>
          <CardTitle>루틴 체크</CardTitle>
          <CardDescription>매주 반복하는 루틴을 추가하고 가볍게 체크해 보세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <RoutineTracker routines={routines} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>할 일 진행률</CardTitle>
          <CardDescription>새 할 일을 만들고 슬라이더로 진행률을 바로 반영할 수 있어요.</CardDescription>
        </CardHeader>
        <CardContent>
          <TaskProgressPanel tasks={tasks} />
        </CardContent>
      </Card>
    </div>
  );
}
