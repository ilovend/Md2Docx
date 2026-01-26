import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { release } from 'os'
import { join } from 'path'
import { spawn, type ChildProcess } from 'child_process'

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
    app.quit()
    process.exit(0)
}

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null
let pyProc: ChildProcess | null = null
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js')
const url = process.env.VITE_DEV_SERVER_URL
const publicDir = process.env.PUBLIC || join(__dirname, '../public')
const distDir = process.env.DIST || join(__dirname, '../dist')
const indexHtml = join(distDir, 'index.html')

const startBackend = () => {
    const scriptPath = join(__dirname, '../../../../main.py') // Dev path assuming dist-electron/main
    // In dev, we run from frontend/ dir. main.py is in ../main.py
    // However, __dirname points to dist-electron/main/

    // Let's use absolute path relative to CWD for dev reliability
    const pyPath = join(process.cwd(), '../main.py')

    console.log('Starting Python backend from:', pyPath)

    pyProc = spawn('python', [pyPath], {
        cwd: join(process.cwd(), '../'), // Run in project root
        stdio: 'inherit', // Show output in terminal
    })

    pyProc.on('error', (err) => {
        console.error('Failed to start python backend:', err)
    })
}

const exitBackend = () => {
    if (pyProc) {
        pyProc.kill()
        pyProc = null
        console.log('Python backend killed')
    }
}

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
    })

    if (url) { // electron-vite-plugin injects VITE_DEV_SERVER_URL
        await win.loadURL(url)
        // Open devTool if the app is not packaged
        win.webContents.openDevTools()
    } else {
        await win.loadFile(indexHtml)
    }

    // Test actively push message to the Electron-Renderer
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', new Date().toLocaleString())
    })

    // Make all links open with the browser, not with the application
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:')) shell.openExternal(url)
        return { action: 'deny' }
    })
}

app.whenReady().then(() => {
    startBackend()
    createWindow()
})

app.on('will-quit', () => {
    exitBackend()
})

app.on('window-all-closed', () => {
    win = null
    if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
    if (win) {
        // Focus on the main window if the user tried to open another
        if (win.isMinimized()) win.restore()
        win.focus()
    }
})

app.on('activate', () => {
    const allWindows = BrowserWindow.getAllWindows()
    if (allWindows.length) {
        allWindows[0].focus()
    } else {
        createWindow()
    }
})

// IPC Communication
ipcMain.handle('ping', () => 'pong')
