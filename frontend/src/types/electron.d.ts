// Electron API types for renderer process

export interface ElectronAPI {
  // File dialogs
  openFile: (options?: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>;
  openDirectory: () => Promise<Electron.OpenDialogReturnValue>;
  saveFile: (options?: Electron.SaveDialogOptions) => Promise<Electron.SaveDialogReturnValue>;

  // Backend health check
  checkBackendHealth: () => Promise<{ ok: boolean; status?: number; error?: string }>;

  // App paths
  getAppPath: (name: string) => Promise<string>;

  // General IPC
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  on: (channel: string, listener: (event: any, ...args: any[]) => void) => () => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};
