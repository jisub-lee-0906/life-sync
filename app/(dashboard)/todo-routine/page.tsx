import { getRoutineOverview, getTaskOverview } from "@/actions/planner";
import { RoutineTracker } from "@/components/planner/routine-tracker";
import { TaskProgressPanel } from "@/components/planner/task-progress-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function TodoRoutinePage() {
  const [routines, tasks] = await Promise.all([getRoutineOverview(), getTaskOverview()]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-6">
      <Card>
        <CardHeader>
          <CardTitle>루틴</CardTitle>
          <CardDescription>매일 이어가고 싶은 흐름을 조용하게 체크해 보세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <RoutineTracker routines={routines} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>할 일</CardTitle>
          <CardDescription>추가부터 진행률 조절까지 한 흐름으로 이어서 할 수 있어요.</CardDescription>
        </CardHeader>
        <CardContent>
          <TaskProgressPanel tasks={tasks} />
        </CardContent>
      </Card>
    </div>
  );
}
