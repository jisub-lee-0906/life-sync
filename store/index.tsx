"use client";

import { createContext, type PropsWithChildren, useContext, useState } from "react";
import { createStore, type StoreApi } from "zustand/vanilla";
import { useStore } from "zustand";

type PlannerStoreState = {
  isCalendarDrawerOpen: boolean;
  selectedDate: string | null;
  selectedMandalartCellId: string | null;
};

type PlannerStore = PlannerStoreState & {
  closeCalendarDrawer: () => void;
  selectDate: (date: string | null) => void;
  selectMandalartCell: (cellId: string | null) => void;
};

function createPlannerStore(initialState?: Partial<PlannerStoreState>) {
  return createStore<PlannerStore>((set) => ({
    closeCalendarDrawer: () => set({ isCalendarDrawerOpen: false }),
    isCalendarDrawerOpen: initialState?.isCalendarDrawerOpen ?? false,
    selectDate: (date) =>
      set({
        isCalendarDrawerOpen: Boolean(date),
        selectedDate: date,
      }),
    selectMandalartCell: (cellId) => set({ selectedMandalartCellId: cellId }),
    selectedDate: initialState?.selectedDate ?? null,
    selectedMandalartCellId: initialState?.selectedMandalartCellId ?? null,
  }));
}

const PlannerStoreContext = createContext<StoreApi<PlannerStore> | null>(null);

export function PlannerStoreProvider({
  children,
  initialState,
}: PropsWithChildren<{ initialState?: Partial<PlannerStoreState> }>) {
  const [store] = useState(() => createPlannerStore(initialState));

  return (
    <PlannerStoreContext.Provider value={store}>
      {children}
    </PlannerStoreContext.Provider>
  );
}

export function usePlannerStore<T>(selector: (state: PlannerStore) => T) {
  const store = useContext(PlannerStoreContext);

  if (!store) {
    throw new Error("usePlannerStore must be used within PlannerStoreProvider.");
  }

  return useStore(store, selector);
}
