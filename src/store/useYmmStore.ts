import { create } from "zustand";

export type YmmRootType = {
  id: number;
  // PartsLogic responses vary a bit; keep both.
  value?: string;
  name?: string;
};

export interface YmmState {
  isYmmActive: boolean;
  rootTypes: YmmRootType[];
  rootTypesLoaded: boolean;
  checkYmmStatus: () => Promise<void>;
  loadRootTypes: () => Promise<void>;
}

export const useYmmStore = create<YmmState>((set, get) => ({
  isYmmActive: false,
  rootTypes: [],
  rootTypesLoaded: false,

  checkYmmStatus: async () => {
    if (typeof window === "undefined") return;

    const baseUrl = process.env.NEXT_PUBLIC_PARTSLOGIC_URL;
    if (!baseUrl) {
      set({ isYmmActive: false });
      return;
    }

    try {
      const res = await fetch(`${baseUrl}/api/ping`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        set({ isYmmActive: false });
        return;
      }

      const data = (await res.json()) as { message?: string };
      const active = data?.message === "pong";
      set({ isYmmActive: active });

      if (active) {
        // Warm cache for YMM dropdowns when present.
        void get().loadRootTypes();
      }
    } catch (e) {
      console.error("Failed to check YMM status:", e);
      set({ isYmmActive: false });
    }
  },

  loadRootTypes: async () => {
    if (typeof window === "undefined") return;
    if (get().rootTypesLoaded) return;

    const baseUrl = process.env.NEXT_PUBLIC_PARTSLOGIC_URL;
    if (!baseUrl) return;

    try {
      const res = await fetch(`${baseUrl}/api/fitment-search/root-types`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) return;

      const json = (await res.json()) as { data?: YmmRootType[] };
      const rootTypes = Array.isArray(json?.data) ? json.data : [];
      set({ rootTypes, rootTypesLoaded: true });
    } catch (e) {
      console.error("Failed to load YMM root types:", e);
    }
  },
}));

