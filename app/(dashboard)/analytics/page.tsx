import { getAnalyticsData } from "@/actions/planner";
import { AnalyticsDashboard } from "@/components/planner/analytics-dashboard";
import { formatTimeZoneYearMonthValue, SEOUL_TIME_ZONE } from "@/lib/timezone-date";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const currentMonth = formatTimeZoneYearMonthValue(new Date(), SEOUL_TIME_ZONE);
  const analytics = await getAnalyticsData(currentMonth);

  return <AnalyticsDashboard {...analytics} />;
}
