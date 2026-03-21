import { getMandalart } from "@/actions/planner";
import { MandalartBoard } from "@/components/planner/mandalart-board";
import { PlannerStoreProvider } from "@/store";

export const dynamic = "force-dynamic";

export default async function MandalartPage() {
  const board = await getMandalart();

  return (
    <PlannerStoreProvider
      initialState={{
        selectedMandalartCellId: null,
      }}
    >
      <MandalartBoard board={board} />
    </PlannerStoreProvider>
  );
}
