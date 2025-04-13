/// <reference types="electron" />

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { join } = require('path');
const { writeFile } = require('fs/promises');
const { shell } = require('electron');
const isDev = require('electron-is-dev');
const { homedir } = require('os');
const { FontManager } = require('./fontManager');
const { checkForUpdates } = require('./updater');
const { getPreferences, savePreferences } = require('./preferences');
const { autoUpdater } = require('electron-updater');

// Disable code signing verification to fix update issues
process.env.UPDATER_FORCE_NO_VERIFY = 'true';
app.commandLine.appendSwitch('disable-features', 'AppVerifier');

// Set application name
app.name = 'Hurufa';
app.setAppUserModelId('com.fontorganizer.app');

const port = process.env.PORT || 5173;
const fontManager = new FontManager();

let mainWindow: typeof BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 20 }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Load saved preferences
  const preferences = getPreferences();
  
  // Create the browser window
  createWindow();
  
  // Initialize auto-updater
  checkForUpdates();
  
  // Save preferences when app is about to quit
  app.on('before-quit', () => {
    savePreferences(preferences);
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Get possible font paths for the current platform
function getFontPaths(fontInfo: { name: string; style?: string; type: string }): string[] {
  if (process.platform === 'darwin') {
    const userHome = homedir();
    
    // Clean up font names - remove any invalid characters
    const safeFamily = fontInfo.name.replace(/[^a-zA-Z0-9\s-]/g, '');
    const safeStyle = fontInfo.style?.replace(/[^a-zA-Z0-9\s-]/g, '') || '';
    
    // Try different name variations
    const nameVariations = [
      safeFamily,  // Just the family name
      safeFamily.replace(/\s+/g, ''),  // No spaces
      safeFamily.replace(/\s+/g, '-'), // Hyphenated
      safeFamily.replace(/\s+/g, '_'), // Underscored
      `${safeFamily}-${safeStyle}`,    // Family-Style
      `${safeFamily}${safeStyle}`,     // FamilyStyle
      `${safeFamily}_${safeStyle}`,    // Family_Style
      safeStyle                        // Just the style
    ].filter(Boolean); // Remove empty strings

    const paths: string[] = [];
    const fontDirs = [
      '/Library/Fonts',
      join(userHome, 'Library/Fonts'),
      '/System/Library/Fonts',
      '/Network/Library/Fonts'
    ];

    // Generate all possible combinations
    for (const dir of fontDirs) {
      for (const name of nameVariations) {
        paths.push(
          join(dir, `${name}.${fontInfo.type}`),
          join(dir, `${name}.${fontInfo.type.toUpperCase()}`),
          join(dir, name, `${name}.${fontInfo.type}`),
          join(dir, name, `${name}.${fontInfo.type.toUpperCase()}`),
          // Add common variations
          join(dir, `${name.toLowerCase()}.${fontInfo.type}`),
          join(dir, `${name.toLowerCase()}.${fontInfo.type.toUpperCase()}`),
          join(dir, `${name.toUpperCase()}.${fontInfo.type}`),
          join(dir, `${name.toUpperCase()}.${fontInfo.type.toUpperCase()}`)
        );
      }
    }

    return [...new Set(paths)]; // Remove duplicates
  } else {
    // Windows paths
    const safeFamily = fontInfo.name.replace(/[^a-zA-Z0-9\s-]/g, '');
    const safeStyle = fontInfo.style?.replace(/[^a-zA-Z0-9\s-]/g, '') || '';
    
    const nameVariations = [
      safeFamily,
      safeFamily.replace(/\s+/g, ''),
      safeFamily.replace(/\s+/g, '-'),
      safeFamily.replace(/\s+/g, '_'),
      `${safeFamily}-${safeStyle}`,
      `${safeFamily}${safeStyle}`,
      `${safeFamily}_${safeStyle}`,
      safeStyle
    ].filter(Boolean);

    const paths = nameVariations.flatMap(name => [
      join('C:\\Windows\\Fonts', `${name}.${fontInfo.type}`),
      join('C:\\Windows\\Fonts', `${name}.${fontInfo.type.toUpperCase()}`),
      join('C:\\Windows\\Fonts', `${name.toLowerCase()}.${fontInfo.type}`),
      join('C:\\Windows\\Fonts', `${name.toLowerCase()}.${fontInfo.type.toUpperCase()}`),
      join('C:\\Windows\\Fonts', `${name.toUpperCase()}.${fontInfo.type}`),
      join('C:\\Windows\\Fonts', `${name.toUpperCase()}.${fontInfo.type.toUpperCase()}`)
    ]);

    return [...new Set(paths)]; // Remove duplicates
  }
}

// Handle moving files to trash using native font manager
ipcMain.handle('move-to-trash', async (_event: Electron.IpcMainInvokeEvent, fontInfo: { name: string; style?: string; type: string }) => {
  try {
    // For macOS, use the native font manager via AppleScript
    if (process.platform === 'darwin') {
      const fullName = fontInfo.style ? `${fontInfo.name} ${fontInfo.style}` : fontInfo.name;
      const success = await fontManager.moveToTrash(fullName);
      
      if (success) {
        return { success: true };
      } else {
        // If native method fails, fall back to the file-based approach
        const possiblePaths = getFontPaths(fontInfo);
        for (const fontPath of possiblePaths) {
          try {
            await shell.trashItem(fontPath);
            console.log('Successfully moved to trash:', fontPath);
            return { success: true };
          } catch (err: any) {
            if (err.code !== 'ENOENT') {
              console.error(`Failed to move ${fontPath} to trash:`, err);
            }
          }
        }
        throw new Error(`Could not find font file for ${fontInfo.name}${fontInfo.style ? ` ${fontInfo.style}` : ''}`);
      }
    } else {
      // Use the file-based approach for other platforms
      const possiblePaths = getFontPaths(fontInfo);
      let success = false;
      
      for (const fontPath of possiblePaths) {
        try {
          await shell.trashItem(fontPath);
          console.log('Successfully moved to trash:', fontPath);
          success = true;
          break;
        } catch (err: any) {
          if (err.code !== 'ENOENT') {
            console.error(`Failed to move ${fontPath} to trash:`, err);
          }
        }
      }
      
      if (!success) {
        throw new Error(`Could not find font file for ${fontInfo.name}${fontInfo.style ? ` ${fontInfo.style}` : ''}`);
      }
      
      return { success: true };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Get extended font information using native methods
ipcMain.handle('get-font-details', async (_event: Electron.IpcMainInvokeEvent, fontName: string) => {
  try {
    // Get the font path first
    const fontPath = await fontManager.getFontPath(fontName);
    
    if (!fontPath) {
      throw new Error(`Could not find font: ${fontName}`);
    }
    
    // Get metadata and OpenType features
    const metadata = await fontManager.getFontMetadata(fontPath);
    const features = await fontManager.getOpenTypeFeatures(fontPath);
    
    return {
      success: true,
      path: fontPath,
      metadata,
      features
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Get information about all installed fonts
ipcMain.handle('get-all-font-details', async () => {
  try {
    const fontDetails = await fontManager.getFontDetails();
    return { success: true, fonts: fontDetails };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Handle saving font files
ipcMain.handle('save-font-file', async (_event: Electron.IpcMainInvokeEvent, options: { name: string; data: ArrayBuffer; type: 'otf' | 'ttf' }) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Save Font File',
      defaultPath: `${options.name}.${options.type}`,
      filters: [
        { name: 'Font Files', extensions: [options.type] }
      ]
    });

    if (canceled || !filePath) {
      return { success: false, error: 'Operation cancelled' };
    }

    await writeFile(filePath, Buffer.from(options.data));
    return { success: true, filePath };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Handle saving ZIP files
ipcMain.handle('save-zip-file', async (_event: Electron.IpcMainInvokeEvent, options: { name: string; data: ArrayBuffer }) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Save Font Archive',
      defaultPath: options.name,
      filters: [
        { name: 'ZIP Archives', extensions: ['zip'] }
      ]
    });

    if (canceled || !filePath) {
      return { success: false, error: 'Operation cancelled' };
    }

    await writeFile(filePath, Buffer.from(options.data));
    return { success: true, filePath };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

interface DialogOptions {
  title: string;
  message: string;
}

// Handle confirmation dialogs
ipcMain.handle('show-confirmation', async (_event: Electron.IpcMainInvokeEvent, { title, message }: DialogOptions) => {
  const { response } = await dialog.showMessageBox({
    type: 'question',
    buttons: ['Cancel', 'OK'],
    defaultId: 0,
    title: title,
    message: message,
    cancelId: 0
  });
  return response === 1;
});

// Handle showing error dialogs
ipcMain.on('show-error', (_event: Electron.IpcMainEvent, { title, message }: DialogOptions) => {
  if (!mainWindow?.isDestroyed()) {
    dialog.showErrorBox(title, message);
  }
}); 