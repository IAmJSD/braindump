import z from "zod";
import { db } from "../database";
import * as schema from "../schema";
import { eq } from "drizzle-orm";

export const input = z.object({
    id: z.number(),
});

export const output = z.object({ success: z.boolean() });

export const handler = async (input: { id: number }) => {
    await db.update(schema.calendarEvents)
        .set({ completed: true })
        .where(eq(schema.calendarEvents.id, input.id));
    return { success: true };
};
