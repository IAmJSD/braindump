import z from "zod";
import { db } from "../database";
import * as schema from "../schema";
import { between, sql } from "drizzle-orm";

export const input = z.object({
    start: z.string(),
    end: z.string(),
});

export const output = z.array(z.object({
    date: z.string(), // YYYY-MM-DD
    averageMood: z.number(),
}));

export const handler = async (input: { start: string; end: string }) => {
    const rows = await db
        .select({
            date: sql<string>`TO_CHAR(${schema.thoughts.createdAt}, 'YYYY-MM-DD')`,
            averageMood: sql<number>`AVG(${schema.thoughts.mood})`,
        })
        .from(schema.thoughts)
        .where(between(schema.thoughts.createdAt, new Date(input.start), new Date(input.end)))
        .groupBy(sql`TO_CHAR(${schema.thoughts.createdAt}, 'YYYY-MM-DD')`);

    return rows.map(r => ({
        date: r.date,
        averageMood: Number(r.averageMood),
    }));
};
