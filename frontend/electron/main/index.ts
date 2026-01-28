import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { release } from 'os';
import { join } from 'path';
import { spawn, type ChildProcess } from 'child_process';
import * as fs from 'fs';

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

let win: BrowserWindow | null = null;
let pyProc: ChildProcess | null = null;
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js');
const url = process.env.VITE_DEV_SERVER_URL;
const publicDir = process.env.PUBLIC || join(__dirname, '../public');
const distDir = process.env.DIST || join(__dirname, '../dist');
const indexHtml = join(distDir, 'index.html');

const startBackend = () => {
  // Determine backend path based on environment
  let backendPath: string;
  let backendCwd: string;

  if (app.isPackaged) {
    // Production: backend is bundled with the app
    backendPath = join(process.resourcesPath, 'backend', 'main.py');
    backendCwd = join(process.resourcesPath, 'backend');
  } else {
    // Development: backend is in project root
    // __dirname in dev: frontend/dist-electron/main
    // We need to go up to project root: ../../../
    backendPath = join(__dirname, '../../../backend/main.py');
    backendCwd = join(__dirname, '../../../backend');
  }

  console.log('[Electron] Starting Python backend');
  console.log('[Electron] Backend path:', backendPath);
  console.log('[Electron] Backend CWD:', backendCwd);

  // Check if backend file exists
  if (!fs.existsSync(backendPath)) {
    console.error('[Electron] Backend file not found:', backendPath);
    return;
  }

  // Determine Python command
  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

  pyProc = spawn(
    pythonCmd,
    ['-m', 'uvicorn', 'backend.main:app', '--host', '127.0.0.1', '--port', '8000'],
    {
      cwd: backendCwd,
      stdio: 'pipe',
    },
  );

  if (pyProc.stdout) {
    pyProc.stdout.on('data', (data) => {
      console.log('[Backend]', data.toString().trim());
    });
  }

  if (pyProc.stderr) {
    pyProc.stderr.on('data', (data) => {
      console.error('[Backend Error]', data.toString().trim());
    });
  }

  pyProc.on('error', (err) => {
    console.error('[Electron] Failed to start Python backend:', err);
  });

  pyProc.on('exit', (code) => {
    console.log('[Electron] Python backend exited with code:', code);
  });

  // Wait for backend to be ready
  setTimeout(() => {
    checkBackendHealth();
  }, 3000);
};

const checkBackendHealth = async () => {
  try {
    const response = await fetch('http://127.0.0.1:8000/health');
    if (response.ok) {
      console.log('[Electron] Backend is healthy');
    } else {
      console.warn('[Electron] Backend health check failed:', response.status);
    }
  } catch (error) {
    console.error('[Electron] Backend health check error:', error);
  }
};

const exitBackend = () => {
  if (pyProc) {
    pyProc.kill();
    pyProc = null;
    console.log('Python backend killed');
  }
};

async function createWindow() {
  win = new BrowserWindow({
    title: 'Md2Docx',
    icon: join(publicDir, 'favicon.ico'),
    width: 1200,
    height: 800,
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      contextIsolation: true,
    },
  });

  if (url) {
    // electron-vite-plugin injects VITE_DEV_SERVER_URL
    await win.loadURL(url);
    // Open devTool if the app is not packaged
    win.webContents.openDevTools();
  } else {
    await win.loadFile(indexHtml);
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  startBackend();
  createWindow();
});

app.on('will-quit', () => {
  exitBackend();
});

app.on('window-all-closed', () => {
  win = null;
  if (process.platform !== 'darwin') app.quit();
});

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// IPC Communication
ipcMain.handle('ping', () => 'pong');

// File dialog handlers
ipcMain.handle('dialog:openFile', async (_, options?: Electron.OpenDialogOptions) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Documents', extensions: ['md', 'docx', 'txt'] },
      { name: 'Markdown', extensions: ['md'] },
      { name: 'Word Documents', extensions: ['docx'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    ...options,
  });
  return result;
});

ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  return result;
});

ipcMain.handle('dialog:saveFile', async (_, options?: Electron.SaveDialogOptions) => {
  const result = await dialog.showSaveDialog({
    filters: [
      { name: 'Word Documents', extensions: ['docx'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    ...options,
  });
  return result;
});

// Backend status check
ipcMain.handle('backend:checkHealth', async () => {
  try {
    const response = await fetch('http://127.0.0.1:8000/health');
    return { ok: response.ok, status: response.status };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
});

// Get app paths
ipcMain.handle('app:getPath', (_, name: string) => {
  return app.getPath(name as any);
});
