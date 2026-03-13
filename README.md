# MCP App Workshop: Todo List Manager

A 1-hour hands-on workshop where you build an MCP (Model Context Protocol) server from scratch using TypeScript. You'll create a **Todo List Manager** that connects to Claude Desktop, learning all three MCP primitives along the way:

- **Tools** — Functions that Claude can call (like API endpoints)
- **Resources** — Data that Claude can read (like GET endpoints)
- **Prompts** — Reusable prompt templates (like saved workflows)

## Prerequisites

- **Node.js 18+** — [Download](https://nodejs.org/)
- **Claude Desktop** — [Download](https://claude.ai/download)
- **Code editor** — VS Code recommended

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Open `WORKSHOP.md` and follow the step-by-step tutorial.

## Falling Behind?

Each file in the `steps/` directory is a complete, standalone snapshot. Copy any step to `src/index.ts` to catch up:

```bash
cp steps/step1_hello_world.ts src/index.ts
npm run build
```

| File | What it adds |
|------|-------------|
| `steps/step1_hello_world.ts` | Minimal server with one `hello` tool |
| `steps/step2_todo_crud.ts` | Four CRUD tools for managing todos |
| `steps/step3_resources.ts` | `todo://list` resource for reading data |
| `steps/step4_prompts.ts` | `plan-tasks` prompt template (final version) |
