import { app, BrowserWindow, ipcMain, systemPreferences } from "electron";
import { join } from "path";
import { pgLite } from "./database";
import { readFileSync } from "node:fs";
import rpc from "./rpc";
import { homedir } from "os";
import { env } from "@huggingface/transformers";

// Pass --enable-source-maps to the electron process
process.env.NODE_OPTIONS = "--enable-source-maps";

// Handles bundlers
const dirName = import.meta.dirname;
globalThis.__MY_DIRNAME__ = dirName;

// Set the cache directory to ~/.braindump/hf_cache
env.cacheDir = join(homedir(), ".braindump/hf_cache");

async function ready() {
    // Run the migrations
    await pgLite.exec("CREATE EXTENSION IF NOT EXISTS vector");
    const schema = readFileSync(join(globalThis.__MY_DIRNAME__, "schema.sql"), "utf8");
    await pgLite.exec(schema);

    // Handle the IPC messages
    ipcMain.handle("rpc", (_, name, args) => {
        return rpc[name as keyof typeof rpc].handler(args);
    });

    // Setup the window
    const window = new BrowserWindow({
        width: 1200,
        height: 600,
        webPreferences: {
            preload: join(dirName, "./preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            nodeIntegrationInWorker: false,
            sandbox: true,
        },
        backgroundColor: systemPreferences.getEffectiveAppearance() === "dark" ? "#1a1a1a" : "#ffffff",
        title: "Braindump",
    });
    if (process.env.NODE_ENV === "development") {
        window.webContents.openDevTools();
        window.loadURL("http://localhost:5173");
    } else {
        window.loadFile(join(dirName, "../ui-dist/index.html"));
    }

    // Handle the window being closed
    window.on("closed", () => {
        app.quit();
    });
}

app.whenReady().then(ready);
