const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const { join } = require("path");
const { writeFile } = require("fs/promises");
const { shell } = require("electron");
const isDev = require("electron-is-dev");
const { homedir } = require("os");
const { FontManager } = require("./fontManager");
const { checkForUpdates } = require("./updater");
const { getPreferences, savePreferences } = require("./preferences");
const { autoUpdater } = require("electron-updater");
process.env.UPDATER_FORCE_NO_VERIFY = "true";
app.commandLine.appendSwitch("disable-features", "AppVerifier");
app.name = "Hurufa";
app.setAppUserModelId("com.hurufa.fontfinder");
const port = process.env.PORT || 5173;
const fontManager = new FontManager();
let mainWindow = null;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, "preload.js")
    },
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 20, y: 20 }
  });
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, "../dist/index.html"));
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
app.whenReady().then(() => {
  const preferences = getPreferences();
  createWindow();
  checkForUpdates();
  app.on("before-quit", () => {
    savePreferences(preferences);
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
function getFontPaths(fontInfo) {
  var _a, _b;
  if (process.platform === "darwin") {
    const userHome = homedir();
    const safeFamily = fontInfo.name.replace(/[^a-zA-Z0-9\s-]/g, "");
    const safeStyle = ((_a = fontInfo.style) == null ? void 0 : _a.replace(/[^a-zA-Z0-9\s-]/g, "")) || "";
    const nameVariations = [
      safeFamily,
      // Just the family name
      safeFamily.replace(/\s+/g, ""),
      // No spaces
      safeFamily.replace(/\s+/g, "-"),
      // Hyphenated
      safeFamily.replace(/\s+/g, "_"),
      // Underscored
      `${safeFamily}-${safeStyle}`,
      // Family-Style
      `${safeFamily}${safeStyle}`,
      // FamilyStyle
      `${safeFamily}_${safeStyle}`,
      // Family_Style
      safeStyle
      // Just the style
    ].filter(Boolean);
    const paths = [];
    const fontDirs = [
      "/Library/Fonts",
      join(userHome, "Library/Fonts"),
      "/System/Library/Fonts",
      "/Network/Library/Fonts"
    ];
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
    return [...new Set(paths)];
  } else {
    const safeFamily = fontInfo.name.replace(/[^a-zA-Z0-9\s-]/g, "");
    const safeStyle = ((_b = fontInfo.style) == null ? void 0 : _b.replace(/[^a-zA-Z0-9\s-]/g, "")) || "";
    const nameVariations = [
      safeFamily,
      safeFamily.replace(/\s+/g, ""),
      safeFamily.replace(/\s+/g, "-"),
      safeFamily.replace(/\s+/g, "_"),
      `${safeFamily}-${safeStyle}`,
      `${safeFamily}${safeStyle}`,
      `${safeFamily}_${safeStyle}`,
      safeStyle
    ].filter(Boolean);
    const paths = nameVariations.flatMap((name) => [
      join("C:\\Windows\\Fonts", `${name}.${fontInfo.type}`),
      join("C:\\Windows\\Fonts", `${name}.${fontInfo.type.toUpperCase()}`),
      join("C:\\Windows\\Fonts", `${name.toLowerCase()}.${fontInfo.type}`),
      join("C:\\Windows\\Fonts", `${name.toLowerCase()}.${fontInfo.type.toUpperCase()}`),
      join("C:\\Windows\\Fonts", `${name.toUpperCase()}.${fontInfo.type}`),
      join("C:\\Windows\\Fonts", `${name.toUpperCase()}.${fontInfo.type.toUpperCase()}`)
    ]);
    return [...new Set(paths)];
  }
}
ipcMain.handle("move-to-trash", async (_event, fontInfo) => {
  try {
    if (process.platform === "darwin") {
      const fullName = fontInfo.style ? `${fontInfo.name} ${fontInfo.style}` : fontInfo.name;
      const success = await fontManager.moveToTrash(fullName);
      if (success) {
        return { success: true };
      } else {
        const possiblePaths = getFontPaths(fontInfo);
        for (const fontPath of possiblePaths) {
          try {
            await shell.trashItem(fontPath);
            console.log("Successfully moved to trash:", fontPath);
            return { success: true };
          } catch (err) {
            if (err.code !== "ENOENT") {
              console.error(`Failed to move ${fontPath} to trash:`, err);
            }
          }
        }
        throw new Error(`Could not find font file for ${fontInfo.name}${fontInfo.style ? ` ${fontInfo.style}` : ""}`);
      }
    } else {
      const possiblePaths = getFontPaths(fontInfo);
      let success = false;
      for (const fontPath of possiblePaths) {
        try {
          await shell.trashItem(fontPath);
          console.log("Successfully moved to trash:", fontPath);
          success = true;
          break;
        } catch (err) {
          if (err.code !== "ENOENT") {
            console.error(`Failed to move ${fontPath} to trash:`, err);
          }
        }
      }
      if (!success) {
        throw new Error(`Could not find font file for ${fontInfo.name}${fontInfo.style ? ` ${fontInfo.style}` : ""}`);
      }
      return { success: true };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});
ipcMain.handle("get-font-details", async (_event, fontName) => {
  try {
    const fontPath = await fontManager.getFontPath(fontName);
    if (!fontPath) {
      throw new Error(`Could not find font: ${fontName}`);
    }
    const metadata = await fontManager.getFontMetadata(fontPath);
    const features = await fontManager.getOpenTypeFeatures(fontPath);
    return {
      success: true,
      path: fontPath,
      metadata,
      features
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
ipcMain.handle("get-all-font-details", async () => {
  try {
    const fontDetails = await fontManager.getFontDetails();
    return { success: true, fonts: fontDetails };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
ipcMain.handle("save-font-file", async (_event, options) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "Save Font File",
      defaultPath: `${options.name}.${options.type}`,
      filters: [
        { name: "Font Files", extensions: [options.type] }
      ]
    });
    if (canceled || !filePath) {
      return { success: false, error: "Operation cancelled" };
    }
    await writeFile(filePath, Buffer.from(options.data));
    return { success: true, filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
ipcMain.handle("save-zip-file", async (_event, options) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "Save Font Archive",
      defaultPath: options.name,
      filters: [
        { name: "ZIP Archives", extensions: ["zip"] }
      ]
    });
    if (canceled || !filePath) {
      return { success: false, error: "Operation cancelled" };
    }
    await writeFile(filePath, Buffer.from(options.data));
    return { success: true, filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
ipcMain.handle("show-confirmation", async (_event, { title, message }) => {
  const { response } = await dialog.showMessageBox({
    type: "question",
    buttons: ["Cancel", "OK"],
    defaultId: 0,
    title,
    message,
    cancelId: 0
  });
  return response === 1;
});
ipcMain.on("show-error", (_event, { title, message }) => {
  if (!(mainWindow == null ? void 0 : mainWindow.isDestroyed())) {
    dialog.showErrorBox(title, message);
  }
});
