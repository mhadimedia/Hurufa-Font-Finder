const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron',
  {
    moveToTrash: async (fontInfo: { name: string; style?: string; type: string }) => {
      return await ipcRenderer.invoke('move-to-trash', fontInfo);
    },
    saveFontFile: async (options: { name: string; data: ArrayBuffer; type: 'otf' | 'ttf' }) => {
      return await ipcRenderer.invoke('save-font-file', options);
    },
    saveZipFile: async (options: { name: string; data: ArrayBuffer }) => {
      return await ipcRenderer.invoke('save-zip-file', options);
    },
    showError: (title: string, message: string) => {
      ipcRenderer.send('show-error', { title, message });
    },
    showConfirmation: async (title: string, message: string) => {
      return await ipcRenderer.invoke('show-confirmation', { title, message });
    },
    // New native font manager APIs
    getFontDetails: async (fontName: string) => {
      return await ipcRenderer.invoke('get-font-details', fontName);
    },
    getAllFontDetails: async () => {
      return await ipcRenderer.invoke('get-all-font-details');
    }
  }
); 