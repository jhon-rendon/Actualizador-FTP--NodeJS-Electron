const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const url          = require('url');
const path         = require('path');
require("dotenv").config();

let mainWindow;

// Reload in Development for Browser Windows
if(process.env.NODE_ENV !== 'production') {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '../node_modules', '.bin', 'electron')
  });
}

var isDev = process.env.APP_DEV ? (process.env.APP_DEV.trim() == "true") : false;

if (isDev) {
    require('electron-reload')(__dirname, {
        electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
    });
}


app.on('ready', () => {

  // The Main Window
  mainWindow = new BrowserWindow({
    width: 1200, 
    height: 790,
    webPreferences:{
      nodeIntegration: true
    }
  });

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'views/index.html'),
    protocol: 'file',
    slashes: true
  }))

  //Menu.setApplicationMenu(null);
  //mainWindow.setResizable(false);

  // If we close main Window the App quit
  mainWindow.on('closed', () => {
    app.quit();
  });

});

