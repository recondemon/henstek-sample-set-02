const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld(
  "venueStore",
  Object.freeze({
    load: () => ipcRenderer.invoke("venue:load"),
    save: (value) => ipcRenderer.invoke("venue:save", value),
    export: () => ipcRenderer.invoke("venue:export"),
  }),
);
