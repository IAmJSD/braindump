import { pipeline } from "@huggingface/transformers";
import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { mkdirSync } from "fs";
import { join } from "path";
import * as schema from "./schema";
import { homedir } from "os";
import { eq, and, sql, desc, between } from "drizzle-orm";
import { vector } from "@electric-sql/pglite/vector";

export type Thought = {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    content: string;
    aiSummary: string;
    landmark: boolean;
    suicidal: boolean;
    anxiety: boolean;
    mood: number;
};

export type Transaction = {
    createThought: (
        thought: string,
        llmDescription: string,
        landmark: boolean,
        suicidal: boolean,
        anxiety: boolean,
        mood: number,
    ) => Promise<number>;
    updateThought: (
        thoughtId: number,
        updatedByThoughtId: number,
        thought: string | null,
        llmDescription: string | null,
        landmark: boolean | null,
        suicidal: boolean | null,
        anxiety: boolean | null,
        mood: number | null,
    ) => Promise<void>;
    deleteThought: (thoughtId: number, deletedByThoughtId: number) => Promise<void>;
    createCalendarEvent: (
        title: string,
        description: string,
        startDate: Date | null,
        endDate: Date | null,
        urgency: number,
        completed: boolean,
        thoughtId: number,
    ) => Promise<number>;
    updateCalendarEvent: (
        calendarEventId: number,
        updatedByThoughtId: number,
        title: string | null,
        description: string | null,
        startDate: Date | null,
        endDate: Date | null,
        urgency: number | null,
    ) => Promise<void>;
    deleteCalendarEvent: (calendarEventId: number, deletedByThoughtId: number) => Promise<void>;
};

function cache<T>(key: string, fn: () => T) {
    let cache = globalThis.__CACHE__;
    if (!cache) {
        cache = new Map();
        globalThis.__CACHE__ = cache;
    }
    let v = cache.get(key);
    if (!v) {
        v = fn();
        cache.set(key, v);
    }
    return v;
}

const extractor = cache("extractor", () => pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2"));

const dbPath = join(homedir(), ".braindump");
mkdirSync(dbPath, { recursive: true });
export const pgLite = new PGlite(join(dbPath, "db"), {
    extensions: { vector },
});
export const db = drizzle(pgLite, { schema });

export function runTransaction<T>(hn: (tx: Transaction) => Promise<T>) {
    return db.transaction((tx) => {
        const x: Transaction = {
            createThought: async (thought, llmDescription, landmark, suicidal, anxiety, mood) => {
                const [thoughtEmbedding, aiSummaryEmbedding] = await Promise.all([
                    extractFeatures(thought),
                    extractFeatures(llmDescription),
                ]);
                if (mood > 1 || mood < 0) {
                    throw new Error("Mood must be between 0 and 1, got " + mood);
                }
                const result = await tx.insert(schema.thoughts).values({
                    aiSummary: llmDescription,
                    aiSummaryEmbedding: aiSummaryEmbedding,
                    landmark: landmark,
                    suicidal: suicidal,
                    anxiety: anxiety,
                    mood: mood,
                    content: thought,
                    contentEmbedding: thoughtEmbedding,
                }).returning({ id: schema.thoughts.id });
                return result[0].id;
            },
            updateThought: async (thoughtId, updatedByThoughtId, thought, llmDescription, landmark, suicidal, anxiety, mood) => {
                const obj: {
                    [K in keyof typeof schema.thoughts.$inferSelect]?: typeof schema.thoughts.$inferSelect[K];
                } = {};

                await Promise.all([
                    (async () => {
                        if (thought) {
                            obj.content = thought;
                            obj.contentEmbedding = await extractFeatures(thought);
                        }
                    })(),
                    (async () => {
                        if (llmDescription) {
                            obj.aiSummary = llmDescription;
                            obj.aiSummaryEmbedding = await extractFeatures(llmDescription);
                        }
                    })(),
                ]);

                if (landmark !== null) obj.landmark = landmark;
                if (suicidal !== null) obj.suicidal = suicidal;
                if (anxiety !== null) obj.anxiety = anxiety;
                if (mood !== null) obj.mood = mood;
                obj.updatedAt = new Date();

                if (Object.keys(obj).length === 0) throw new Error("No changes to update");
                await tx.update(schema.thoughts).set(obj).where(eq(schema.thoughts.id, thoughtId));
                await tx.insert(schema.thoughtUpdates).values({
                    thoughtId: thoughtId,
                    updaterThoughtId: updatedByThoughtId,
                });
            },
            deleteThought: async (thoughtId, deletedByThoughtId) => {
                const result = await tx.delete(schema.thoughts).where(eq(schema.thoughts.id, thoughtId)).returning({ content: schema.thoughts.content });
                if (result.length === 0) throw new Error("Thought not found");
                await tx.insert(schema.deletedThoughts).values({
                    thoughtDeletedBy: deletedByThoughtId,
                    deletedThought: result[0].content,
                });
            },
            createCalendarEvent: async (title, description, startDate, endDate, urgency, completed, thoughtId) => {
                const [titleEmbedding, descriptionEmbedding] = await Promise.all([
                    extractFeatures(title),
                    extractFeatures(description),
                ]);
                if (startDate && endDate && startDate > endDate) {
                    throw new Error("Start date must be before end date");
                }
                if (urgency > 1 || urgency < 0) {
                    throw new Error("Urgency must be between 0 and 1, got " + urgency);
                }
                const result = await tx.insert(schema.calendarEvents).values({
                    title: title,
                    titleEmbedding: titleEmbedding,
                    description: description,
                    descriptionEmbedding: descriptionEmbedding,
                    startDate: startDate,
                    endDate: endDate,
                    urgency: urgency,
                    completed: completed,
                    thoughtId: thoughtId,
                }).returning({ id: schema.calendarEvents.id });
                return result[0].id;
            },
            updateCalendarEvent: async (calendarEventId, updatedByThoughtId, title, description, startDate, endDate, urgency) => {
                const obj: {
                    [K in keyof typeof schema.calendarEvents.$inferSelect]?: typeof schema.calendarEvents.$inferSelect[K];
                } = {};
                
                await Promise.all([
                    (async () => {
                        if (title) {
                            obj.title = title;
                            obj.titleEmbedding = await extractFeatures(title);
                        }
                    })(),
                    (async () => {
                        if (description) {
                            obj.description = description;
                            obj.descriptionEmbedding = await extractFeatures(description);
                        }
                    })(),
                ]);
                if (startDate !== null) obj.startDate = startDate;
                if (endDate !== null) obj.endDate = endDate;
                if (urgency !== null) obj.urgency = urgency;
                obj.updatedAt = new Date();
                if (Object.keys(obj).length === 0) throw new Error("No changes to update");
                await tx.update(schema.calendarEvents).set(obj).where(eq(schema.calendarEvents.id, calendarEventId));
                await tx.insert(schema.thoughtCalendarUpdates).values({
                    calendarEventId,
                    thoughtId: updatedByThoughtId,
                });
            },
            deleteCalendarEvent: async (calendarEventId, deletedByThoughtId) => {
                const result = await tx.delete(schema.calendarEvents).where(eq(schema.calendarEvents.id, calendarEventId)).returning({ title: schema.calendarEvents.title, description: schema.calendarEvents.description });
                if (result.length === 0) throw new Error("Calendar event not found");
                await tx.insert(schema.deletedCalendarEvents).values({
                    calendarEventDeletedBy: deletedByThoughtId,
                    deletedCalendarEvent: result[0].title + "\n\n" + result[0].description,
                });
            },
        };
        return hn(x);
    });
}

export async function extractFeatures(text: string) {
    const output = await (await extractor)(text, {
        pooling: "mean",
        normalize: true,
    });
    return Array.from(output.data).map((value: unknown) => Number(value as number));
}

function toPgVectorLiteral(values: number[]): string {
    return `[${values.join(",")}]`;
}

function toContainsPattern(query: string): string {
    const escaped = query
        .replace(/\\/g, "\\\\")
        .replace(/%/g, "\\%")
        .replace(/_/g, "\\_");
    return `%${escaped}%`;
}

export type SearchCalendarEvent = {
    id: number;
    createdAt: Date;
    title: string;
    description: string;
    urgency: number;
    startDate: Date | null;
    completed: boolean;
};

export async function searchCalendarEvents(query: string): Promise<SearchCalendarEvent[]> {
    const queryEmbedding = await extractFeatures(query);
    const queryVector = toPgVectorLiteral(queryEmbedding);
    const containsPattern = toContainsPattern(query);
    return await db.select({
        id: schema.calendarEvents.id,
        createdAt: schema.calendarEvents.createdAt,
        title: schema.calendarEvents.title,
        description: schema.calendarEvents.description,
        urgency: schema.calendarEvents.urgency,
        startDate: schema.calendarEvents.startDate,
        completed: schema.calendarEvents.completed,
    }).from(schema.calendarEvents).where(
        sql`
            (
                LEAST(
                    ${schema.calendarEvents.titleEmbedding} <-> ${queryVector}::vector,
                    ${schema.calendarEvents.descriptionEmbedding} <-> ${queryVector}::vector
                ) < 0.5
                OR ${schema.calendarEvents.title} ILIKE ${containsPattern} ESCAPE '\\'
                OR ${schema.calendarEvents.description} ILIKE ${containsPattern} ESCAPE '\\'
            )
        `
    ).orderBy(desc(schema.calendarEvents.createdAt)).limit(20);
}

export async function searchThoughts(query: string): Promise<Thought[]> {
    const queryEmbedding = await extractFeatures(query);
    const queryVector = toPgVectorLiteral(queryEmbedding);
    const containsPattern = toContainsPattern(query);
    return await db.select({
        id: schema.thoughts.id,
        createdAt: schema.thoughts.createdAt,
        updatedAt: schema.thoughts.updatedAt,
        content: schema.thoughts.content,
        aiSummary: schema.thoughts.aiSummary,
        landmark: schema.thoughts.landmark,
        suicidal: schema.thoughts.suicidal,
        anxiety: schema.thoughts.anxiety,
        mood: schema.thoughts.mood,
    }).from(schema.thoughts).where(
        sql`
            (
                ${schema.thoughts.contentEmbedding} <-> ${queryVector}::vector < 0.5
                OR ${schema.thoughts.content} ILIKE ${containsPattern} ESCAPE '\\'
                OR ${schema.thoughts.aiSummary} ILIKE ${containsPattern} ESCAPE '\\'
            )
        `
    ).orderBy(desc(schema.thoughts.createdAt)).limit(100);
}

export async function get10MostRecentThoughts(): Promise<Thought[]> {
    return await db.select({
        id: schema.thoughts.id,
        createdAt: schema.thoughts.createdAt,
        updatedAt: schema.thoughts.updatedAt,
        content: schema.thoughts.content,
        aiSummary: schema.thoughts.aiSummary,
        landmark: schema.thoughts.landmark,
        suicidal: schema.thoughts.suicidal,
        anxiety: schema.thoughts.anxiety,
        mood: schema.thoughts.mood,
    }).from(schema.thoughts).orderBy(desc(schema.thoughts.createdAt)).limit(10);
}

export type CalendarEvent = {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    title: string;
    description: string;
    startDate: Date | null;
    endDate: Date | null;
    urgency: number;
};

export async function get10NewestIncompleteEvents(): Promise<CalendarEvent[]> {
    return await db.select({
        id: schema.calendarEvents.id,
        createdAt: schema.calendarEvents.createdAt,
        updatedAt: schema.calendarEvents.updatedAt,
        title: schema.calendarEvents.title,
        description: schema.calendarEvents.description,
        startDate: schema.calendarEvents.startDate,
        endDate: schema.calendarEvents.endDate,
        urgency: schema.calendarEvents.urgency,
    }).from(schema.calendarEvents).where(eq(schema.calendarEvents.completed, false)).orderBy(desc(schema.calendarEvents.createdAt)).limit(10);
}

export async function get10MostUrgentIncompleteEvents(): Promise<CalendarEvent[]> {
    return await db.select({
        id: schema.calendarEvents.id,
        createdAt: schema.calendarEvents.createdAt,
        updatedAt: schema.calendarEvents.updatedAt,
        title: schema.calendarEvents.title,
        description: schema.calendarEvents.description,
        startDate: schema.calendarEvents.startDate,
        endDate: schema.calendarEvents.endDate,
        urgency: schema.calendarEvents.urgency,
    }).from(schema.calendarEvents).where(eq(schema.calendarEvents.completed, false)).orderBy(desc(schema.calendarEvents.urgency)).limit(10);
}

export async function getEventsActiveBetween(start: Date, end: Date): Promise<CalendarEvent[]> {
    return await db.select({
        id: schema.calendarEvents.id,
        createdAt: schema.calendarEvents.createdAt,
        updatedAt: schema.calendarEvents.updatedAt,
        title: schema.calendarEvents.title,
        description: schema.calendarEvents.description,
        startDate: schema.calendarEvents.startDate,
        endDate: schema.calendarEvents.endDate,
        urgency: schema.calendarEvents.urgency,
    }).from(schema.calendarEvents).where(and(eq(schema.calendarEvents.completed, false), between(schema.calendarEvents.startDate, start, end))).orderBy(desc(schema.calendarEvents.createdAt)).limit(10);
}

export async function getKV(key: string): Promise<unknown> {
    const result = await db.select({ value: schema.kv.value }).from(schema.kv).where(eq(schema.kv.key, key));
    return result.length > 0 ? result[0].value : null;
}

export async function setKV(key: string, value: unknown): Promise<void> {
    await db.insert(schema.kv).values({ key, value }).onConflictDoUpdate({
        target: [schema.kv.key],
        set: { value },
    });
}
