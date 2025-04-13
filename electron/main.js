import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import isDev from 'electron-is-dev';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Get the appropriate icon path based on platform
function getIconPath() {
  switch (process.platform) {
    case 'darwin':
      return path.join(__dirname, '../src/assets/icons/icon.icns');
    case 'win32':
      return path.join(__dirname, '../src/assets/icons/icon.ico');
    default:
      return path.join(__dirname, '../src/assets/icons/icon.png');
  }
}

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    titleBarStyle: 'hiddenInset', // macOS-style window controls
    trafficLightPosition: { x: 20, y: 20 }, // Position of the traffic light buttons
    icon: getIconPath(), // Set the application icon
  });

  // Load the index.html from a url in development or the local file in production
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath);
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  createWindow();

  // Set the application icon in the dock (macOS)
  if (process.platform === 'darwin') {
    app.dock.setIcon(getIconPath());
  }

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
}); 