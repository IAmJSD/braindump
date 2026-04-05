import z from "zod";
import { searchThoughts, searchCalendarEvents } from "../database";

export const input = z.object({ query: z.string() });

export const output = z.object({
    thoughts: z.array(z.object({
        id: z.number(),
        createdAt: z.string(),
        content: z.string(),
        aiSummary: z.string(),
        mood: z.number(),
        landmark: z.boolean(),
    })),
    events: z.array(z.object({
        id: z.number(),
        title: z.string(),
        description: z.string(),
        urgency: z.number(),
        startDate: z.string().nullable(),
        completed: z.boolean(),
    })),
});

export const handler = async (input: { query: string }) => {
    const [thoughts, events] = await Promise.all([
        searchThoughts(input.query),
        searchCalendarEvents(input.query),
    ]);

    return {
        thoughts: thoughts.map(t => ({
            id: t.id,
            createdAt: t.createdAt.toISOString(),
            content: t.content,
            aiSummary: t.aiSummary,
            mood: t.mood,
            landmark: t.landmark,
        })),
        events: events.map(e => ({
            id: e.id,
            title: e.title,
            description: e.description,
            urgency: e.urgency,
            startDate: e.startDate ? e.startDate.toISOString() : null,
            completed: e.completed,
        })),
    };
};
