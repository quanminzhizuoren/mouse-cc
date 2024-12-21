import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, globalShortcut, ipcMain, Menu, shell, Tray } from 'electron'
import fs from 'node:fs'
import { join } from 'path'
import mouse from '../../lib/node-addons/build/Release/mouse.node'
import icon from '../../resources/icon.png?asset'
let mainWindow: BrowserWindow | null = null
function createWindow(): void {
  // Create the browser window.
  if (mainWindow) return
  mainWindow = new BrowserWindow({
    width: 330,
    height: 300,
    show: false,
    autoHideMenuBar: true,
    resizable: false,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // app.quit()
    mainWindow?.destroy()
    mainWindow = null
  }
})

// 退出按钮的事件
ipcMain.on('quit', () => app.quit())

type Data = { target: string; keypad: string; interval: number }

// 读取配置文件
const paths = app.getPath('userData')
const configPath = join(paths, 'config.json')

const data: Data = { target: 'left', keypad: 'F8', interval: 0.3 }

try {
  // 初始化配置文件 没有则创建
  if (!fs.existsSync(configPath) || !fs.statSync(configPath).isFile()) {
    fs.writeFileSync(configPath, JSON.stringify(data))
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as Data
  Object.assign(data, config)
} catch (error) {
  Object.assign(data, { target: 'left', keypad: 'F8', interval: 0.3 })
}

// 更新配置
ipcMain.on('update-data', (_, res: Data) => {
  Object.assign(data, res)
  setup(data)
})
// 返回配置信息给渲染进程
ipcMain.handle('get-data', () => data)
// 渲染进程触发的开始事件
ipcMain.on('satrt', () => {
  stop()
  start(data)
  isStart = true
})

let timer: NodeJS.Timeout | null = null
// 设置开始点击
const start = (data: Data) => {
  if (timer) {
    clearInterval(timer)
  }

  mainWindow?.destroy()
  mainWindow = null
  timer = setInterval(() => {
    mouse.down(data.target)
    mouse.up(data.target)
  }, data.interval * 1000)
}
// 停止点击
const stop = () => {
  createWindow()
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

// 当前是否开始点击
let isStart = false
// 上一次的快捷键
let oldkeypad = ''
// 设置快捷键
const setup = (data: Data) => {
  const { keypad } = data
  // 快捷键发生变化则重新注册
  if (oldkeypad !== keypad) {
    // oldkeypad && globalShortcut.unregister(oldkeypad)
    oldkeypad && globalShortcut.unregisterAll()
    globalShortcut.register(keypad, () => {
      isStart = !isStart
      if (isStart) {
        start(data)
      } else {
        stop()
      }
    })
  }
  // 保存新的配置
  fs.writeFileSync(configPath, JSON.stringify(data))
}

let tray: Tray | null = null
// 创建托盘
const createTray = () => {
  tray = new Tray(icon)
  tray.setToolTip('鼠标连点器')
  tray.on('click', () => {
    createWindow()
  })
  const menu = Menu.buildFromTemplate([
    {
      label: '退出',
      click: () => {
        app.quit()
      }
    }
  ])
  tray.setContextMenu(menu)
}

app.on('ready', createTray)
