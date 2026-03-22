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
          <CardTitle>Routine Tracker</CardTitle>
          <CardDescription>
            Weekly routine checks are synced with secure server actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RoutineTracker routines={routines} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Task Progress</CardTitle>
          <CardDescription>
            Drag smoothly, persist only on commit to avoid flooding the server.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TaskProgressPanel tasks={tasks} />
        </CardContent>
      </Card>
    </div>
  );
}
