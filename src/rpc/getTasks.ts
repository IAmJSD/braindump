import z from "zod";
import { get10MostUrgentIncompleteEvents } from "../database";

export const input = z.undefined();

export const output = z.array(z.object({
    id: z.number(),
    title: z.string(),
    description: z.string(),
    urgency: z.number(),
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
}));

export const handler = async () => {
    const events = await get10MostUrgentIncompleteEvents();
    return events.map(e => ({
        id: e.id,
        title: e.title,
        description: e.description,
        urgency: e.urgency,
        startDate: e.startDate ? e.startDate.toISOString() : null,
        endDate: e.endDate ? e.endDate.toISOString() : null,
    }));
};
