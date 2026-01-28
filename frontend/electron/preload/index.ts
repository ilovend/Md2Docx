import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // File dialogs
  openFile: (options?: any) => ipcRenderer.invoke('dialog:openFile', options),
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  saveFile: (options?: any) => ipcRenderer.invoke('dialog:saveFile', options),

  // Backend health check
  checkBackendHealth: () => ipcRenderer.invoke('backend:checkHealth'),

  // App paths
  getAppPath: (name: string) => ipcRenderer.invoke('app:getPath', name),

  // General IPC
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  on: (channel: string, listener: (event: any, ...args: any[]) => void) => {
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
});
