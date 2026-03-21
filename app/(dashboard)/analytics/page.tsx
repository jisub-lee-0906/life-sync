import { format } from "date-fns";
import { getAnalyticsData } from "@/actions/planner";
import { AnalyticsDashboard } from "@/components/planner/analytics-dashboard";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const currentMonth = format(new Date(), "yyyy-MM");
  const analytics = await getAnalyticsData(currentMonth);

  return <AnalyticsDashboard {...analytics} />;
}
