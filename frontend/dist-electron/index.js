import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { release } from 'os';
import { join } from 'path';
import { spawn } from 'child_process';
if (release().startsWith('6.1')) app.disableHardwareAcceleration();
if (process.platform === 'win32') app.setAppUserModelId(app.getName());
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
let win = null;
let pyProc = null;
const preload = join(__dirname, '../preload/index.js');
const url = process.env.VITE_DEV_SERVER_URL;
const publicDir = process.env.PUBLIC || join(__dirname, '../public');
const distDir = process.env.DIST || join(__dirname, '../dist');
const indexHtml = join(distDir, 'index.html');
const startBackend = () => {
  join(__dirname, '../../../../main.py');
  const pyPath = join(process.cwd(), '../main.py');
  console.log('Starting Python backend from:', pyPath);
  pyProc = spawn('python', [pyPath], {
    cwd: join(process.cwd(), '../'),
    // Run in project root
    stdio: 'inherit',
    // Show output in terminal
  });
  pyProc.on('error', (err) => {
    console.error('Failed to start python backend:', err);
  });
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
    await win.loadURL(url);
    win.webContents.openDevTools();
  } else {
    await win.loadFile(indexHtml);
  }
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', /* @__PURE__ */ new Date().toLocaleString());
  });
  win.webContents.setWindowOpenHandler(({ url: url2 }) => {
    if (url2.startsWith('https:')) shell.openExternal(url2);
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
ipcMain.handle('ping', () => 'pong');
