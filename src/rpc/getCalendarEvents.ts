import z from "zod";
import { getEventsActiveBetween } from "../database";

export const input = z.object({
    start: z.string(),
    end: z.string(),
});

export const output = z.array(z.object({
    id: z.number(),
    title: z.string(),
    description: z.string(),
    urgency: z.number(),
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
}));

export const handler = async (input: { start: string; end: string }) => {
    const events = await getEventsActiveBetween(new Date(input.start), new Date(input.end));
    return events.map(e => ({
        id: e.id,
        title: e.title,
        description: e.description,
        urgency: e.urgency,
        startDate: e.startDate ? e.startDate.toISOString() : null,
        endDate: e.endDate ? e.endDate.toISOString() : null,
    }));
};
