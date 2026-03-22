import { getCalendarData, getPlannerPanelData } from "@/actions/planner";
import { LifeCalendar } from "@/components/planner/life-calendar";
import { formatTimeZoneDateOnlyValue, formatTimeZoneYearMonthValue, SEOUL_TIME_ZONE } from "@/lib/timezone-date";
import { PlannerStoreProvider } from "@/store";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const today = new Date();
  const initialDate = formatTimeZoneDateOnlyValue(today, SEOUL_TIME_ZONE);
  const initialMonth = formatTimeZoneYearMonthValue(today, SEOUL_TIME_ZONE);
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
