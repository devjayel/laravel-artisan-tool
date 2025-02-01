window.addEventListener("DOMContentLoaded", () => {
    console.log("Preload script loaded");
});

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
    ipcRenderer: {
        send: (channel, ...args) => ipcRenderer.send(channel, ...args),
        invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
        on: (channel, callback) => ipcRenderer.on(channel, callback),
        removeListener: (channel, callback) => ipcRenderer.removeListener(channel, callback),
    },
});
