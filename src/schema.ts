import { boolean, foreignKey, index, integer, jsonb, pgTable, real, serial, text, timestamp, vector } from "drizzle-orm/pg-core";

export const thoughts = pgTable("thoughts", {
    id: serial("id").primaryKey(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    content: text("content").notNull(),
    contentEmbedding: vector("content_embedding", {
        dimensions: 384,
    }).notNull(),
    aiSummary: text("ai_summary").notNull(),
    aiSummaryEmbedding: vector("ai_summary_embedding", {
        dimensions: 384,
    }).notNull(),
    landmark: boolean("landmark").notNull().default(false),
    suicidal: boolean("suicidal").notNull().default(false),
    anxiety: boolean("anxiety").notNull().default(false),
    mood: real("mood").notNull(), // between 0 and 1
}, (table) => [
    index("idx_thoughts_created_at").on(table.createdAt),
    index("idx_updated_at").on(table.updatedAt),
    index("idx_content_embedding").using("hnsw", table.contentEmbedding.op("vector_cosine_ops")),
    index("idx_ai_summary_embedding").using("hnsw", table.aiSummaryEmbedding.op("vector_cosine_ops")),

]);

export const thoughtUpdates = pgTable("thought_updates", {
    id: serial("id").primaryKey(),
    createdAt: timestamp("created_at").defaultNow(),
    thoughtId: integer("thought_id").references(() => thoughts.id),
    updaterThoughtId: integer("updater_thought_id").references(() => thoughts.id),
}, (table) => [
    index("idx_thought_updates_thought_id").on(table.thoughtId),
    index("idx_thought_updates_updater_thought_id").on(table.updaterThoughtId),
    foreignKey({
        columns: [table.thoughtId],
        foreignColumns: [thoughts.id],
    }).onDelete("cascade"),
    foreignKey({
        columns: [table.updaterThoughtId],
        foreignColumns: [thoughts.id],
    }).onDelete("cascade"),
]);

export const deletedThoughts = pgTable("deleted_thoughts", {
    id: serial("id").primaryKey(),
    createdAt: timestamp("created_at").defaultNow(),
    thoughtDeletedBy: integer("thought_deleted_by").references(() => thoughts.id),
    deletedThought: text("deleted_thought").notNull(),
}, (table) => [
    index("idx_thought_deleted_by").on(table.thoughtDeletedBy),
    foreignKey({
        columns: [table.thoughtDeletedBy],
        foreignColumns: [thoughts.id],
    }).onDelete("cascade"),
]);

export const calendarEvents = pgTable("calendar_events", {
    id: serial("id").primaryKey(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    urgency: real("urgency").notNull(), // between 0 and 1
    title: text("title").notNull(),
    titleEmbedding: vector("title_embedding", {
        dimensions: 384,
    }).notNull(),
    description: text("description").notNull(),
    descriptionEmbedding: vector("description_embedding", {
        dimensions: 384,
    }).notNull(),
    startDate: timestamp("start_date").defaultNow(),
    endDate: timestamp("end_date"),
    completed: boolean("completed").notNull().default(false),
    thoughtId: integer("thought_id").references(() => thoughts.id),
}, (table) => [
    index("idx_calendar_events_created_at").on(table.createdAt),
    index("idx_start_date").on(table.startDate),
    index("idx_end_date").on(table.endDate),
    index("idx_completed").on(table.completed),
    index("idx_calendar_events_thought_id").on(table.thoughtId),
    index("idx_title_embedding").using("hnsw", table.titleEmbedding.op("vector_cosine_ops")),
    index("idx_description_embedding").using("hnsw", table.descriptionEmbedding.op("vector_cosine_ops")),
    foreignKey({
        columns: [table.thoughtId],
        foreignColumns: [thoughts.id],
    }).onDelete("cascade"),
]);

export const thoughtCalendarUpdates = pgTable("thought_calendar_updates", {
    id: serial("id").primaryKey(),
    createdAt: timestamp("created_at").defaultNow(),
    thoughtId: integer("thought_id").references(() => thoughts.id),
    calendarEventId: integer("calendar_event_id").references(() => calendarEvents.id),
}, (table) => [
    index("idx_thought_calendar_updates_created_at").on(table.createdAt),
    index("idx_thought_calendar_updates_thought_id").on(table.thoughtId),
    index("idx_thought_calendar_updates_calendar_event_id").on(table.calendarEventId),
    foreignKey({
        columns: [table.thoughtId],
        foreignColumns: [thoughts.id],
    }).onDelete("cascade"),
    foreignKey({
        columns: [table.calendarEventId],
        foreignColumns: [calendarEvents.id],
    }).onDelete("cascade"),
]);

export const deletedCalendarEvents = pgTable("deleted_calendar_events", {
    id: serial("id").primaryKey(),
    createdAt: timestamp("created_at").defaultNow(),
    calendarEventDeletedBy: integer("calendar_event_deleted_by").references(() => thoughts.id),
    deletedCalendarEvent: text("deleted_calendar_event").notNull(),
}, (table) => [
    index("idx_calendar_event_deleted_by").on(table.calendarEventDeletedBy),
    foreignKey({
        columns: [table.calendarEventDeletedBy],
        foreignColumns: [thoughts.id],
    }).onDelete("cascade"),
]);

export const kv = pgTable("kv", {
    key: text("key").primaryKey(),
    value: jsonb("value").notNull(),
});
