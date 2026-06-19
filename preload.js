const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getStartupItems: () => ipcRenderer.invoke('get-startup-items'),
  readScriptContent: (filePath) => ipcRenderer.invoke('read-script-content', filePath),
  revealInExplorer: (filePath) => ipcRenderer.invoke('reveal-in-explorer', filePath),
  disableStartupItem: (item) => ipcRenderer.invoke('disable-startup-item', item)
});
