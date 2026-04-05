import z from "zod";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
    getKV,
    runTransaction,
    searchThoughts,
    get10MostRecentThoughts,
    get10NewestIncompleteEvents,
    get10MostUrgentIncompleteEvents,
    getEventsActiveBetween,
} from "../database";
import adapters from "../adapters";
import type { Prompt } from "../adapters/_base";
import type { RuntimeAdapter } from "../adapters/_base";

export const input = z.object({
    content: z.string().min(1),
});

export const output = z.object({
    success: z.boolean(),
    suicidal: z.boolean(),
});

const aiAnalysisSchema = z.object({
    aiSummary: z.string().describe("A neutral summarisation of the user's thought, no editorialising."),
    suicidal: z.boolean(),
    landmark: z.boolean().describe("True if mood changed significantly vs recent thoughts, or a life-changing event is mentioned."),
    anxiety: z.boolean(),
    mood: z.number().describe("Float 0–1 representing mood. Must be <0.3 if suicidal is true."),
    calendarEventsToCreate: z.array(z.object({
        title: z.string(),
        description: z.string(),
        startDate: z.string().nullable().describe("ISO 8601 datetime string or null"),
        endDate: z.string().nullable().describe("ISO 8601 datetime string or null"),
        urgency: z.number().describe("Float 0–1"),
        completed: z.boolean(),
    })),
    calendarEventsToUpdate: z.array(z.object({
        id: z.number(),
        title: z.string().nullable(),
        description: z.string().nullable(),
        startDate: z.string().nullable().describe("ISO 8601 datetime string or null"),
        endDate: z.string().nullable().describe("ISO 8601 datetime string or null"),
        urgency: z.number().nullable().describe("Float 0–1 or null if unchanged"),
    })),
    calendarEventsToDelete: z.array(z.object({
        id: z.number(),
    })),
});

async function executeToolCall(tool: { t: string; query?: string; start?: string; end?: string }): Promise<string> {
    try {
        switch (tool.t) {
            case "search": {
                const results = await searchThoughts(tool.query ?? "");
                return JSON.stringify(results.map(t => ({
                    id: t.id, content: t.content, aiSummary: t.aiSummary,
                    landmark: t.landmark, mood: t.mood, createdAt: t.createdAt,
                })));
            }
            case "10_most_recent_thoughts": {
                const results = await get10MostRecentThoughts();
                return JSON.stringify(results.map(t => ({
                    id: t.id, content: t.content, aiSummary: t.aiSummary,
                    landmark: t.landmark, mood: t.mood, createdAt: t.createdAt,
                })));
            }
            case "10_newest_incomplete_events": {
                const results = await get10NewestIncompleteEvents();
                return JSON.stringify(results.map(e => ({
                    id: e.id, title: e.title, description: e.description,
                    urgency: e.urgency, startDate: e.startDate, endDate: e.endDate,
                })));
            }
            case "10_most_urgent_incomplete_events": {
                const results = await get10MostUrgentIncompleteEvents();
                return JSON.stringify(results.map(e => ({
                    id: e.id, title: e.title, description: e.description,
                    urgency: e.urgency, startDate: e.startDate, endDate: e.endDate,
                })));
            }
            case "events_active_between": {
                const results = await getEventsActiveBetween(
                    new Date(tool.start!),
                    new Date(tool.end!),
                );
                return JSON.stringify(results.map(e => ({
                    id: e.id, title: e.title, description: e.description,
                    urgency: e.urgency, startDate: e.startDate, endDate: e.endDate,
                })));
            }
            default:
                return JSON.stringify({ error: `Unknown tool: ${tool.t}` });
        }
    } catch (e) {
        return JSON.stringify({ error: String(e) });
    }
}

export const handler = async (input: { content: string }) => {
    const defaultAdapterId = await getKV("defaultAdapter") as string | null;
    if (!defaultAdapterId) throw new Error("No default adapter configured");

    const adapter = adapters.find(a => a.name === defaultAdapterId) as RuntimeAdapter | undefined;
    if (!adapter) throw new Error(`Adapter not found: ${defaultAdapterId}`);
    if (!adapter.processJson) throw new Error(`Adapter ${defaultAdapterId} does not support structured output`);

    const token = (await getKV(`adapter:${defaultAdapterId}:token`) as string | null) ?? undefined;
    const storedModel = await getKV("defaultModel") as string | null;
    const modelId = (storedModel && adapter.models.some(m => m[0] === storedModel))
        ? storedModel
        : adapter.defaultModelId;

    const systemPrompt = readFileSync(
        join((globalThis as any).__MY_DIRNAME__, "prompt.md"),
        "utf8",
    ) + `\n\nToday's date is ${new Date().toISOString().slice(0, 10)}.`;

    const messages: Prompt[] = [
        { type: "system", content: systemPrompt },
        { type: "user", content: input.content },
    ];

    // Tool-call loop
    for (let i = 0; i < 10; i++) {
        const response = await adapter.processString(modelId, messages, token);

        let toolCall: { t: string; query?: string; start?: string; end?: string } | null = null;
        try {
            const parsed = JSON.parse(response.trim());
            if (parsed && typeof parsed === "object" && "t" in parsed) toolCall = parsed;
        } catch {}

        // Not a tool call — add as context and exit loop
        if (!toolCall) {
            messages.push({ type: "assistant", content: response });
            break;
        }

        messages.push({ type: "assistant", content: response });
        messages.push({ type: "user", content: await executeToolCall(toolCall) });
    }

    // Structured final analysis
    messages.push({ type: "user", content: "Now output the final structured analysis of this thought." });

    const analysis = await adapter.processJson(
        modelId,
        messages,
        token,
        aiAnalysisSchema,
    );

    // Persist thought + calendar mutations in one transaction
    await runTransaction(async (tx) => {
        const thoughtId = await tx.createThought(
            input.content,
            analysis.aiSummary,
            analysis.landmark,
            analysis.suicidal,
            analysis.anxiety,
            Math.max(0, Math.min(1, analysis.mood)),
        );

        for (const event of analysis.calendarEventsToCreate) {
            await tx.createCalendarEvent(
                event.title,
                event.description,
                event.startDate ? new Date(event.startDate) : null,
                event.endDate ? new Date(event.endDate) : null,
                Math.max(0, Math.min(1, event.urgency)),
                event.completed,
                thoughtId,
            );
        }

        for (const event of analysis.calendarEventsToUpdate) {
            await tx.updateCalendarEvent(
                event.id,
                thoughtId,
                event.title,
                event.description,
                event.startDate ? new Date(event.startDate) : null,
                event.endDate ? new Date(event.endDate) : null,
                event.urgency,
            );
        }

        for (const event of analysis.calendarEventsToDelete) {
            await tx.deleteCalendarEvent(event.id, thoughtId);
        }
    });

    return { success: true, suicidal: analysis.suicidal };
};
