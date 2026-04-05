import z from "zod";
import { dialog } from "electron";
import { copyFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { pendingImportTarPath } from "../dataTransfer";

export const input = z.undefined();

export const output = z.object({
    success: z.boolean(),
    cancelled: z.boolean(),
    restartRequired: z.boolean(),
    path: z.string().nullable(),
});

export const handler = async (): Promise<z.infer<typeof output>> => {
    const result = await dialog.showOpenDialog({
        title: "Import Braindump data backup",
        properties: ["openFile"],
        filters: [{ name: "Braindump backup", extensions: ["tar"] }],
    });

    if (result.canceled || result.filePaths.length === 0) {
        return {
            success: false,
            cancelled: true,
            restartRequired: false,
            path: null,
        };
    }

    const selectedPath = result.filePaths[0];
    await mkdir(dirname(pendingImportTarPath), { recursive: true });
    await copyFile(selectedPath, pendingImportTarPath);

    return {
        success: true,
        cancelled: false,
        restartRequired: true,
        path: selectedPath,
    };
};
