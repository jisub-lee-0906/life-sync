import { format } from "date-fns";
import { getCalendarData, getPlannerPanelData } from "@/actions/planner";
import { LifeCalendar } from "@/components/planner/life-calendar";
import { PlannerStoreProvider } from "@/store";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const today = new Date();
  const initialDate = format(today, "yyyy-MM-dd");
  const initialMonth = format(today, "yyyy-MM");
  const [summary, panelData] = await Promise.all([
    getCalendarData(initialMonth),
    getPlannerPanelData(initialDate),
  ]);

  return (
    <PlannerStoreProvider
      initialState={{
        isCalendarDrawerOpen: false,
        selectedDate: initialDate,
        selectedMandalartCellId: null,
      }}
    >
      <LifeCalendar
        initialMonth={initialMonth}
        initialPanelData={panelData}
        initialSummary={summary}
      />
    </PlannerStoreProvider>
  );
}
