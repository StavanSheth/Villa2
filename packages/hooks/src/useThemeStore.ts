import { create } from 'zustand';

type RoleTheme = 'CUSTOMER' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN';

interface ThemeState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  roleTheme: RoleTheme;
  setRoleTheme: (role: RoleTheme) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  // Default to Customer theme (Blue)
  roleTheme: 'CUSTOMER',
  setRoleTheme: (role) => set({ roleTheme: role }),
}));
