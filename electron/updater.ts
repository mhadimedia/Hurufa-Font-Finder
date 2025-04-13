import { autoUpdater } from 'electron-updater';
import { app, dialog } from 'electron';
import { getPreferences, savePreferences } from './preferences';

// Configure autoUpdater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.allowDowngrade = true;
autoUpdater.allowPrerelease = false;

// Disable code signature verification to fix update issues
autoUpdater.disableWebInstaller = false;
autoUpdater.requiresUpdateClientCertificate = false;
autoUpdater.isUpdaterActive = () => true;

// Load saved preferences
const preferences = getPreferences();

// Check for updates periodically (every 6 hours)
setInterval(() => {
  autoUpdater.checkForUpdates();
}, 6 * 60 * 60 * 1000);

// Handle update events
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info.version);
  
  // Show update dialog
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Available',
    message: `A new version (${info.version}) of Font Organizer is available. Would you like to download and install it now?`,
    buttons: ['Download', 'Later'],
    defaultId: 0,
    cancelId: 1
  }).then(({ response }) => {
    if (response === 0) {
      // User clicked "Download"
      autoUpdater.downloadUpdate();
    }
  });
});

autoUpdater.on('update-not-available', () => {
  console.log('No updates available');
});

autoUpdater.on('download-progress', (progressObj) => {
  console.log('Download progress:', progressObj.percent);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded:', info.version);
  
  // Save current preferences before installing update
  savePreferences(preferences);
  
  // Show install dialog
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Ready',
    message: `Version ${info.version} has been downloaded. Would you like to install it now?`,
    buttons: ['Install and Restart', 'Later'],
    defaultId: 0,
    cancelId: 1
  }).then(({ response }) => {
    if (response === 0) {
      // User clicked "Install and Restart"
      autoUpdater.quitAndInstall();
    }
  });
});

autoUpdater.on('error', (err) => {
  console.error('Error in auto-updater:', err);
  dialog.showErrorBox('Update Error', err.message);
});

// Export function to manually check for updates
export function checkForUpdates() {
  autoUpdater.checkForUpdates();
} 