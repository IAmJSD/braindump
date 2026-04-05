const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld(
    "rpc", {
        invoke: (name, ...args) => ipcRenderer.invoke("rpc", name, ...args),
    },
);
