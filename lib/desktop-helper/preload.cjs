const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hexDesktop', {
  dragStart: (x, y) => ipcRenderer.send('hex:drag-start', { x, y }),
  dragMove: (x, y) => ipcRenderer.send('hex:drag-move', { x, y }),
  dragEnd: () => ipcRenderer.send('hex:drag-end'),
  submitHide: (minutes) => ipcRenderer.send('hex:hide-custom', minutes),
  showMenu: () => ipcRenderer.send('hex:menu'),
  blur: () => ipcRenderer.send('hex:blur'),
  log: (message) => ipcRenderer.send('hex:log', message),
  onPlay: (callback) => ipcRenderer.on('hex:play', (_event, payload) => callback(payload)),
  onTemporaryBubble: (callback) =>
    ipcRenderer.on('hex:temporary-bubble', (_event, payload) => callback(payload)),
  openDsh: (mode) => ipcRenderer.send('hex:open-dsh', mode),
  quit: () => ipcRenderer.send('hex:quit'),
});
