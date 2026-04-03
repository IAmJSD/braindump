import z from "zod";
import adapters from "../adapters";
import { getKV } from "../database";

export const input = z.undefined();

export const output = z.object({
    adapters: z.array(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        privacyNotes: z.array(z.string()),
        tokenRequired: z.boolean(),
        hasToken: z.boolean(),
        models: z.array(z.object({ id: z.string(), name: z.string() })),
        defaultModelId: z.string(),
        iconUrl: z.string(),
    })),
    default: z.nullable(z.string()),
    defaultModel: z.nullable(z.string()),
});

export const handler = async (): Promise<z.infer<typeof output>> => {
    const res = await Promise.all(adapters.map((adapter) => (async () => {
        return {
            id: adapter.name,
            name: adapter.name,
            description: adapter.description,
            privacyNotes: adapter.privacyNotes,
            tokenRequired: adapter.tokenRequired,
            hasToken: !!(await getKV(`adapter:${adapter.name}:token`)),
            models: (adapter.models as readonly (readonly [string, string])[]).map((m) => ({ id: m[0], name: m[1] })),
            defaultModelId: adapter.defaultModelId,
            iconUrl: adapter.iconUrl,
        };
    })()));
    return {
        adapters: res,
        default: await getKV("defaultAdapter") as string | null,
        defaultModel: await getKV("defaultModel") as string | null,
    };
};
