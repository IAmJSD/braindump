import { app, BrowserWindow, ipcMain, Notification, shell, systemPreferences } from "electron";
import { join, dirname } from "path";
import { clearPendingImportBackup, pgLite } from "./database";
import { readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import rpc from "./rpc";
import { homedir } from "os";
import { env } from "@huggingface/transformers";

const RELEASES_URL = "https://api.github.com/repos/IAmJSD/braindump/releases";
const UPDATE_PREFS_FILENAME = "update-preferences.json";

type UpdatePreferences = {
    disableReleaseNotifications?: boolean;
};

function parseSemver(version: string): [number, number, number] | null {
    const cleaned = version.trim().replace(/^v/i, "");
    const match = cleaned.match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);
    if (!match) return null;

    return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function isVersionNewer(candidate: string, current: string): boolean {
    const parsedCandidate = parseSemver(candidate);
    const parsedCurrent = parseSemver(current);
    if (!parsedCandidate || !parsedCurrent) return false;

    for (let i = 0; i < 3; i++) {
        if (parsedCandidate[i] > parsedCurrent[i]) return true;
        if (parsedCandidate[i] < parsedCurrent[i]) return false;
    }

    return false;
}

function isStableRelease(tag: string, prerelease: boolean) {
    if (prerelease) return false;
    return !tag.toLowerCase().includes("beta");
}

type GithubRelease = {
    tag_name: string;
    html_url: string;
    draft: boolean;
    prerelease: boolean;
};

function getUpdatePreferencesPath() {
    return join(app.getPath("userData"), UPDATE_PREFS_FILENAME);
}

async function readUpdatePreferences(): Promise<UpdatePreferences> {
    try {
        const raw = await readFile(getUpdatePreferencesPath(), "utf8");
        return JSON.parse(raw) as UpdatePreferences;
    } catch {
        return {};
    }
}

async function writeUpdatePreferences(preferences: UpdatePreferences) {
    const path = getUpdatePreferencesPath();
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(preferences, null, 2), "utf8");
}

async function notifyIfNewStableRelease() {
    const preferences = await readUpdatePreferences();
    if (preferences.disableReleaseNotifications) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
        const response = await fetch(RELEASES_URL, {
            headers: {
                Accept: "application/vnd.github+json",
            },
            signal: controller.signal,
        });
        if (!response.ok) return;

        const releases = (await response.json()) as GithubRelease[];
        const latestStable = releases.find((release) => !release.draft && isStableRelease(release.tag_name, release.prerelease));
        if (!latestStable) return;

        const installedVersion = app.getVersion();
        if (!isVersionNewer(latestStable.tag_name, installedVersion)) return;

        if (Notification.isSupported()) {
            const notification = new Notification({
                title: "Braindump update available",
                body: `You're on ${installedVersion}. Latest stable is ${latestStable.tag_name}.`,
                actions: [
                    { type: "button", text: "View release" },
                    { type: "button", text: "Don't ask again" },
                ],
                closeButtonText: "Later",
            });

            notification.on("click", () => {
                void shell.openExternal(latestStable.html_url);
            });

            notification.on("action", (_, index) => {
                if (index === 0) {
                    void shell.openExternal(latestStable.html_url);
                    return;
                }
                if (index === 1) {
                    void writeUpdatePreferences({ disableReleaseNotifications: true });
                }
            });

            notification.show();
        }
    } catch {
        // Ignore update-check failures so startup is never blocked.
    } finally {
        clearTimeout(timeout);
    }
}

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
    if (globalThis.__APPLIED_PENDING_IMPORT__) {
        clearPendingImportBackup();
        globalThis.__APPLIED_PENDING_IMPORT__ = false;
    }

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

    void notifyIfNewStableRelease();
}

app.whenReady().then(ready).catch((error) => {
    console.error("Failed to initialize Braindump:", error);
    app.quit();
});
