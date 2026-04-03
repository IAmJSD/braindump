# Braindump

**Work in progress. Not ready yet.**

A local-first desktop app for journaling your thoughts. Write freely — AI analyzes each entry for mood, flags anxious moments, extracts calendar events and tasks, and lets you search everything semantically.

## Features

- **Thought journaling** — write raw stream-of-consciousness entries
- **AI analysis** — each thought is summarized and scored for mood and anxiety
- **Landmark detection** — significant mood shifts or life events are flagged automatically
- **Calendar extraction** — tasks and events mentioned in thoughts are automatically created, updated, or deleted
- **Semantic search** — find past thoughts and events by meaning, not just keywords
- **Mood over time** — visualize your average mood day by day
- **Local-first** — everything is stored on-device via PGLite (embedded Postgres with vector search); nothing leaves your machine except AI API calls

## AI Providers

Braindump supports pluggable AI backends. Configure your preferred provider and model in settings:

- **Mistral**
- **OpenAI**

Your API token is stored locally and used only for processing your thoughts.

## Development

```bash
npm install
npm run dev
```

This starts the Electron main process (with auto-reload via nodemon) and the Vite dev server concurrently.

## Building

```bash
npm run build
```

Produces a distributable macOS app via electron-builder.

## Database schema

Schema is managed with Drizzle ORM. To regenerate the SQL schema file after schema changes:

```bash
npm run export-schema
```
