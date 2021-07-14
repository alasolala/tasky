const electron = require('electron')
const path = require('path')

const { app, BrowserWindow, ipcMain, Tray, Menu, screen, dialog } = electron
const { autoUpdater } = require('electron-updater')
const iconPath = path.join(__dirname, './src/img/icon.png')

let mainWindow
let tray
let remindWindow

app.on('ready', () => {
  //检查更新
  checkUpdate()


  mainWindow = new BrowserWindow({
    frame: false,
    resizable: false,
    width: 800,
    height: 600,
    icon: iconPath,
    webPreferences:{
      backgroundThrottling: false,
      nodeIntegration:true,
      contextIsolation: false
      // preload: path.join(__dirname, './preload.js')
    }
  })
  mainWindow.loadURL(`file://${__dirname}/src/main.html`)
  mainWindow.removeMenu()
  tray = new Tray(iconPath)
  tray.setToolTip('Tasky')
  tray.on('click', () => {
    if(mainWindow.isVisible()){
      mainWindow.hide()
    }else{
      mainWindow.show()
    }
  })
  tray.on('right-click', () => {
    const menuConfig = Menu.buildFromTemplate([
      {
        label: 'Quit',
        click: () => app.quit()
      }
    ])
    tray.popUpContextMenu(menuConfig)
  })

})

ipcMain.on('mainWindow:close', () => {
  mainWindow.hide()
})

ipcMain.on('remindWindow:close', () => {
  remindWindow.close()
})

ipcMain.on('setTaskTimer', (event, time, task) => {
  const now = new Date()
  const date = new Date()
  date.setHours(time.slice(0,2), time.slice(3),0)
  const timeout = date.getTime() - now.getTime()
  setTimeout(() => {
    createRemindWindow(task)
  }, timeout)
})

function createRemindWindow (task) {
  if(remindWindow) remindWindow.close()
  remindWindow = new BrowserWindow({
    height: 450,
    width: 360,
    resizable: false,
    frame: false,
    icon: iconPath,
    show: false,
    webPreferences:{
      nodeIntegration:true,
      contextIsolation: false,
      // preload: path.join(__dirname, './preload.js')
    }
  })
  remindWindow.removeMenu()
  const size = screen.getPrimaryDisplay().workAreaSize
  const { y } = tray.getBounds()
  const { height, width } = remindWindow.getBounds()
  const yPosition = process.platform === 'darwin' ? y : y - height
  remindWindow.setBounds({
    x: size.width - width,
    y: yPosition,
    height,
    width 
  })
  remindWindow.setAlwaysOnTop(true)
  remindWindow.loadURL(`file://${__dirname}/src/remind.html`)
  remindWindow.show()
  remindWindow.webContents.send('setTask', task)
  remindWindow.on('closed', () => { remindWindow = null })
  setTimeout( () => {
    remindWindow && remindWindow.close()
  }, 50 * 1000)
}

function checkUpdate(){
  if(process.platform == 'darwin'){
    autoUpdater.setFeedURL('http://127.0.0.1:9005/darwin')
  }else{
    autoUpdater.setFeedURL('http://127.0.0.1:9005/win32')
  }
  autoUpdater.checkForUpdates()
  autoUpdater.on('error', (err) => {
    console.log(err)
  })
  autoUpdater.on('update-available', () => {
    console.log('found new version')
  })
  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'info',
      title: '应用更新',
      message: '发现新版本，是否更新？',
      buttons: ['是', '否']
    }).then((buttonIndex) => {
      if(buttonIndex.response == 0) {
        autoUpdater.quitAndInstall()
        app.quit()
      }
    })
  })
}

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})