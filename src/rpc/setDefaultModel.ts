import z from "zod";
import { setKV } from "../database";

export const input = z.object({
    modelId: z.string(),
});

export const output = z.object({ success: z.boolean() });

export const handler = async (input: { modelId: string }) => {
    await setKV("defaultModel", input.modelId);
    return { success: true };
};
