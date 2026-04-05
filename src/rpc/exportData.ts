import z from "zod";
import { dialog } from "electron";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pgLite } from "../database";

export const input = z.undefined();

export const output = z.object({
    success: z.boolean(),
    cancelled: z.boolean(),
    path: z.string().nullable(),
});

function getDefaultBackupName() {
    const date = new Date().toISOString().slice(0, 10);
    return `braindump-backup-${date}.tar`;
}

export const handler = async (): Promise<z.infer<typeof output>> => {
    const result = await dialog.showSaveDialog({
        title: "Export Braindump data",
        defaultPath: join(process.cwd(), getDefaultBackupName()),
        filters: [{ name: "Braindump backup", extensions: ["tar"] }],
    });
    if (result.canceled || !result.filePath) {
        return {
            success: false,
            cancelled: true,
            path: null,
        };
    }

    const dump = await pgLite.dumpDataDir();
    const buffer = Buffer.from(await dump.arrayBuffer());
    await writeFile(result.filePath, buffer);

    return {
        success: true,
        cancelled: false,
        path: result.filePath,
    };
};
