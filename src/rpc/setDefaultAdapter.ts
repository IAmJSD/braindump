import z from "zod";
import { setKV } from "../database";

export const input = z.object({
    adapterId: z.string(),
    token: z.string().optional(),
});

export const output = z.object({ success: z.boolean() });

export const handler = async (input: { adapterId: string; token?: string }) => {
    await setKV("defaultAdapter", input.adapterId);
    if (input.token) {
        await setKV(`adapter:${input.adapterId}:token`, input.token);
    }
    return { success: true };
};
