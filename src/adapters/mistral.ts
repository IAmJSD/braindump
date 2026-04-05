import { Adapter, Prompt } from "./_base";
import z from "zod";
import { Mistral } from "@mistralai/mistralai";

const models = [
    ["mistral-small-2603", "Mistral Small 4"],
    ["mistral-large-2512", "Mistral Large 3"],
    ["mistral-medium-2508", "Mistral Medium 3.1"],
    ["mistral-small-2506", "Mistral Small 3.2"],
    ["magistral-medium-2509", "Magistral Medium 1.2"],
] as const;

const description = "The Mistral family of models running on La Plateforme, a French-based AI cloud provider.";

const privacyNotes = [
    "Subject to French data protection laws",
];

export const mistral: Adapter<typeof models> = {
    models,
    processString: async (modelId, prompts, token) => {
        const client = new Mistral({
            apiKey: token,
        });
        const response = await client.chat.complete({
            model: modelId,
            messages: prompts.map((prompt) => ({
                role: prompt.type,
                content: prompt.content,
            })),
            stream: false,
        });
        return response.choices[0].message.content as string || "";
    },
    processJson: async <OutputSchema extends z.ZodType>(modelId:(typeof models)[number][0], prompts: Prompt[], token: string | undefined, outputSchema: OutputSchema) => {
        const client = new Mistral({
            apiKey: token,
        });
        for (let i = 0; i < 5; i++) {
            try {
                const response = await client.chat.parse({
                    model: modelId,
                    messages: prompts.map((prompt) => ({
                        role: prompt.type,
                        content: prompt.content,
                    })),
                    stream: false,
                    responseFormat: outputSchema,
                });
                const x = response.choices?.[0]?.message?.parsed;
                if (x) {
                    return x as z.infer<OutputSchema>;
                }
                throw new Error("Failed to parse response");
            } catch (e) {
                if (i === 4) {
                    throw e;
                }
            }
        }
        throw new Error("Failed to parse response");
    },
    iconUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkxIiBoZWlnaHQ9IjEzNSIgdmlld0JveD0iMCAwIDE5MSAxMzUiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMF8xMzRfMjA4KSI+CjxwYXRoIGQ9Ik01NC4zMjIxIDBIMjcuMTUzMVYyNy4wODkySDU0LjMyMjFWMFoiIGZpbGw9IiNGRkQ4MDAiLz4KPHBhdGggZD0iTTE2Mi45ODQgMEgxMzUuODE1VjI3LjA4OTJIMTYyLjk4NFYwWiIgZmlsbD0iI0ZGRDgwMCIvPgo8cGF0aCBkPSJNODEuNDgyMyAyNy4wOTEzSDI3LjE1MzFWNTQuMTgwNUg4MS40ODIzVjI3LjA5MTNaIiBmaWxsPSIjRkZBRjAwIi8+CjxwYXRoIGQ9Ik0xNjIuOTkgMjcuMDkxM0gxMDguNjYxVjU0LjE4MDVIMTYyLjk5VjI3LjA5MTNaIiBmaWxsPSIjRkZBRjAwIi8+CjxwYXRoIGQ9Ik0xNjIuOTcyIDU0LjE2OEgyNy4xNTMxVjgxLjI1NzJIMTYyLjk3MlY1NC4xNjhaIiBmaWxsPSIjRkY4MjA1Ii8+CjxwYXRoIGQ9Ik01NC4zMjIxIDgxLjI1OTNIMjcuMTUzMVYxMDguMzQ5SDU0LjMyMjFWODEuMjU5M1oiIGZpbGw9IiNGQTUwMEYiLz4KPHBhdGggZD0iTTEwOC42NjEgODEuMjU5M0g4MS40OTE3VjEwOC4zNDlIMTA4LjY2MVY4MS4yNTkzWiIgZmlsbD0iI0ZBNTAwRiIvPgo8cGF0aCBkPSJNMTYyLjk4NCA4MS4yNTkzSDEzNS44MTVWMTA4LjM0OUgxNjIuOTg0VjgxLjI1OTNaIiBmaWxsPSIjRkE1MDBGIi8+CjxwYXRoIGQ9Ik04MS40ODc5IDEwOC4zMzlILTAuMDAxNDY0ODRWMTM1LjQyOUg4MS40ODc5VjEwOC4zMzlaIiBmaWxsPSIjRTEwNTAwIi8+CjxwYXRoIGQ9Ik0xOTAuMTU5IDEwOC4zMzlIMTA4LjY2MVYxMzUuNDI5SDE5MC4xNTlWMTA4LjMzOVoiIGZpbGw9IiNFMTA1MDAiLz4KPC9nPgo8ZGVmcz4KPGNsaXBQYXRoIGlkPSJjbGlwMF8xMzRfMjA4Ij4KPHJlY3Qgd2lkdGg9IjE5MC4xNDEiIGhlaWdodD0iMTM1IiBmaWxsPSJ3aGl0ZSIvPgo8L2NsaXBQYXRoPgo8L2RlZnM+Cjwvc3ZnPgo=",
    name: "Mistral",
    description,
    defaultModelId: "mistral-medium-2508",
    creamOfTheCropModelId: "magistral-medium-2509",
    privacyNotes,
    tokenRequired: true,
};
