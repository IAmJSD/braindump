import z from "zod";
import { db } from "../database";
import * as schema from "../schema";
import { eq, desc } from "drizzle-orm";

export const input = z.undefined();

export const output = z.array(z.object({
    id: z.number(),
    createdAt: z.string(),
    content: z.string(),
    aiSummary: z.string(),
    mood: z.number(),
}));

export const handler = async () => {
    const thoughts = await db.select({
        id: schema.thoughts.id,
        createdAt: schema.thoughts.createdAt,
        content: schema.thoughts.content,
        aiSummary: schema.thoughts.aiSummary,
        mood: schema.thoughts.mood,
    }).from(schema.thoughts)
      .where(eq(schema.thoughts.landmark, true))
      .orderBy(desc(schema.thoughts.createdAt))
      .limit(20);

    return thoughts.map(t => ({
        id: t.id,
        createdAt: t.createdAt.toISOString(),
        content: t.content,
        aiSummary: t.aiSummary,
        mood: t.mood,
    }));
};
