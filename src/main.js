const { app, BrowserWindow } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const { Menu } = require('electron');

app.whenReady().then(() => {
  Menu.setApplicationMenu(null); // Removes the default menu
});

let mainWindow;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true, 
            contextIsolation: false,  // Allow require() in renderer
            enableRemoteModule: true  // Optional: Allow remote module
        }
    });

    mainWindow.loadFile(path.join(__dirname, "index.html"));

    autoUpdater.checkForUpdatesAndNotify();
});

autoUpdater.on("update-available", () => {
    mainWindow.webContents.send("update_available");
});

autoUpdater.on("update-downloaded", () => {
    mainWindow.webContents.send("update_downloaded");
});

const { ipcMain } = require("electron");

ipcMain.on("restart_app", () => {
    autoUpdater.quitAndInstall();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});