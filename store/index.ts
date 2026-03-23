"use client";

import {
  createContext,
  createElement,
  type PropsWithChildren,
  useContext,
  useRef,
} from "react";
import { createStore, type StoreApi } from "zustand/vanilla";
import { create, useStore } from "zustand";

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

type RecurringSyncStore = {
  markMonthSynced: (yearMonth: string) => void;
  resetSyncedMonths: () => void;
  syncedMonths: Set<string>;
};

export function createPlannerStore(initialState?: Partial<PlannerStoreState>) {
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
  const storeRef = useRef<StoreApi<PlannerStore> | null>(null);

  if (storeRef.current === null) {
    storeRef.current = createPlannerStore(initialState);
  }

  // eslint-disable-next-line react-hooks/refs
  const store = storeRef.current;

  return createElement(
    PlannerStoreContext.Provider,
    { value: store },
    children,
  );
}

export function usePlannerStore<T>(selector: (state: PlannerStore) => T) {
  const store = useContext(PlannerStoreContext);

  if (!store) {
    throw new Error("usePlannerStore must be used within PlannerStoreProvider.");
  }

  return useStore(store, selector);
}

export const useRecurringSyncStore = create<RecurringSyncStore>((set) => ({
  markMonthSynced: (yearMonth) =>
    set((state) => ({
      syncedMonths: new Set([...state.syncedMonths, yearMonth]),
    })),
  resetSyncedMonths: () => set({ syncedMonths: new Set() }),
  syncedMonths: new Set<string>(),
}));
