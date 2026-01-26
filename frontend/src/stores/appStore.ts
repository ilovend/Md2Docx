import { create } from 'zustand';

export type View = 'workspace' | 'rules' | 'history' | 'settings' | 'comparison' | 'batch';

interface AppState {
  currentView: View;
  sidebarCollapsed: boolean;
  backendConnected: boolean;
  backendLatency: number;

  setCurrentView: (view: View) => void;
  toggleSidebar: () => void;
  setBackendStatus: (connected: boolean, latency?: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'workspace',
  sidebarCollapsed: false,
  backendConnected: true,
  backendLatency: 24,

  setCurrentView: (view) => set({ currentView: view }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setBackendStatus: (connected, latency = 0) =>
    set({ backendConnected: connected, backendLatency: latency }),
}));
