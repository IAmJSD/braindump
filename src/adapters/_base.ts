import { z } from "zod";

export type Prompt = {
    type: "system" | "user" | "assistant";
    content: string;
};

export type Adapter<Models extends [string, string][] | readonly (readonly [string, string])[]> = {
    models: Models;
    processString: (modelId: Models[number][0], prompts: Prompt[], token: string | undefined) => Promise<string>;
    processJson?: <OutputSchema extends z.ZodType>(modelId: Models[number][0], prompts: Prompt[], token: string | undefined, outputSchema: OutputSchema) => Promise<z.infer<OutputSchema>>;
    iconUrl: string;
    name: string;
    description: string;
    privacyNotes: string[];
    tokenRequired: boolean;
    defaultModelId: Models[number][0];
    creamOfTheCropModelId: Models[number][0];
};

// Widened adapter type for use at runtime call sites where the specific model union is unknown.
export type RuntimeAdapter = {
    models: readonly (readonly [string, string])[];
    processString: (modelId: string, prompts: Prompt[], token: string | undefined) => Promise<string>;
    processJson?: <OutputSchema extends z.ZodType>(modelId: string, prompts: Prompt[], token: string | undefined, outputSchema: OutputSchema) => Promise<z.infer<OutputSchema>>;
    iconUrl: string;
    name: string;
    description: string;
    privacyNotes: string[];
    tokenRequired: boolean;
    defaultModelId: string;
    creamOfTheCropModelId: string;
};
