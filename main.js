const { app, protocol, BrowserWindow, screen, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const http = require('http');
const open = require('open');
const { finished } = require('stream');
const fs = require('fs');
const io = require('socket.io');
const path = require('path');

const DEBUG = false;

const DPATH = DEBUG ? "" : app.getAppPath() + "/";
const closeHTML = fs.readFileSync(DPATH + 'res/html/close.html').toString();
const overlayHTML = fs.readFileSync(DPATH + 'res/html/overlay.html').toString();

var window = null;
function createWindow() {
  let _window = new BrowserWindow({
    width: 720,
    height: 480,
    show: false,
    frame: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      // devTools: false
    }
  });
  // _window.webContents.openDevTools();
  _window.loadFile(DPATH + 'res/html/index.html');
  setTimeout(() => {
    _window.show();
  }, 500);
  return _window;
}

app.whenReady().then(() => {
  window = createWindow();
  autoUpdater.on('update_not_available', () => window.webContents.send('updater', [0]));
  autoUpdater.on('update_available', () => window.webContents.send('updater', [1]));
  autoUpdater.on('update_downloaded', () => window.webContents.send('updater', [2]));
  autoUpdater.on('download-progress', (progress) => window.webContents.send('updater', [3, progress.percent]));
  autoUpdater.on('error', (err) => window.webContents.send('updater', [4, err]));
});

ipcMain.on('checkUpdate', () => {
  autoUpdater.checkForUpdates();
});

ipcMain.on('quitAndInstall', () => {
  autoUpdater.quitAndInstall();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  if (overServ != null) overServ.close(() => { overServ = null; });
  if (serv != null) serv.close();
  if (sock != null) sock.close();
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    window = createWindow();
  }
})
var serv = null;
var serv_out = null;
ipcMain.on('twitchLink', (event, args) => {
  if (serv == null) {
    serv = http.createServer((req, res) => {
      let url = req.url;
      if (url.indexOf('access_denied') != -1) {
        finished('failed');
      }
      console.log('-- ' + url);
      if (url.indexOf('access_token') != -1) {
        console.log(url);
        finished(url.substr(url.indexOf('=') + 1, url.indexOf('&') - url.indexOf('=') - 1));
      }
      res.end(closeHTML);
    })
    serv.listen(80);
  }
  open('https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=1e0ucayvkh2vwrmui0kx2iryrjnfig&redirect_uri=http://localhost&scope=chat:read+chat:edit+channel:moderate+whispers:read+whispers:edit+channel_editor&login=true');
  function finished(token) {
    serv.close();
    serv = null;
    event.reply('twitchToken', token);
    console.log('finished ' + token);
  }
  if (serv_out != null) clearTimeout(serv_out);
  serv_out = setTimeout(() => { if (serv != null) finished('failed') }, 10000);
})

// var sock = null;
// var overServ = null;
// ipcMain.on('hostOpen', () => {
//   if (overServ != null) return;
//   overServ = http.createServer((req, res) => {
//     res.end(overlayHTML.replace('$PORT', 15127));
//   });
//   overServ.listen(15126);
// });
// ipcMain.on('hostClose', () => {
//   if (overServ != null) overServ.close(() => { overServ = null; });
//   setImmediate(() => overServ.emit('close'));
//   console.log('close server');
// });
// ipcMain.on('optChange', (event, args) => {
//   sock.sockets.emit('optChange', args);
// });
// sock = io.listen(15127);
// function listenSock() {
//   sock.on('connection', (client) => {
//     console.log('client connected');
//     client.emit('bgcolor', { a: 'b' });
//     client.on('disconnected', () => {
//       console.log('client disconnected');
//     })
//   });
// }
// listenSock();