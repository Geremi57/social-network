import { create } from "zustand";

interface UIState {
  theme: "light" | "dark";
  sidebarCollapsed: boolean;
  setTheme: (t: "light" | "dark") => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: typeof window !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light",
  sidebarCollapsed: false,
  setTheme: (t) => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", t === "dark");
    }
    set({ theme: t });
  },
  toggleTheme: () => {
    if (typeof document !== "undefined") {
      const isDark = document.documentElement.classList.toggle("dark");
      set({ theme: isDark ? "dark" : "light" });
    }
  },
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
