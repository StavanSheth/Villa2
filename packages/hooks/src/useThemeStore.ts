import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme, RoleTheme } from '@villa-platform/design-system';

interface ThemeState {
  /* ── Day/Night Theme ── */
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;

  /* ── Sidebar ── */
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  /* ── Role Theme ── */
  roleTheme: RoleTheme;
  setRoleTheme: (role: RoleTheme) => void;
}

/**
 * Resolve 'system' preference to 'light' or 'dark'.
 */
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  return theme === 'system' ? getSystemTheme() : theme;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      /* ── Day/Night Theme ── */
      theme: 'dark',
      resolvedTheme: 'dark',
      setTheme: (theme) =>
        set({
          theme,
          resolvedTheme: resolveTheme(theme),
        }),

      /* ── Sidebar ── */
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      /* ── Role Theme ── */
      roleTheme: 'CUSTOMER',
      setRoleTheme: (role) => set({ roleTheme: role }),
    }),
    {
      name: 'villa-theme',
      // Only persist theme and sidebar state, not computed values
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.resolvedTheme = resolveTheme(state.theme);
        }
      },
    }
  )
);
