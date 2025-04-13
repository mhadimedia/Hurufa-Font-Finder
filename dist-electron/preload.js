const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld(
  "electron",
  {
    moveToTrash: async (fontInfo) => {
      return await ipcRenderer.invoke("move-to-trash", fontInfo);
    },
    saveFontFile: async (options) => {
      return await ipcRenderer.invoke("save-font-file", options);
    },
    saveZipFile: async (options) => {
      return await ipcRenderer.invoke("save-zip-file", options);
    },
    showError: (title, message) => {
      ipcRenderer.send("show-error", { title, message });
    },
    showConfirmation: async (title, message) => {
      return await ipcRenderer.invoke("show-confirmation", { title, message });
    },
    // New native font manager APIs
    getFontDetails: async (fontName) => {
      return await ipcRenderer.invoke("get-font-details", fontName);
    },
    getAllFontDetails: async () => {
      return await ipcRenderer.invoke("get-all-font-details");
    }
  }
);
