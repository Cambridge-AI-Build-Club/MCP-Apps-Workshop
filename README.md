# MCP App Workshop: Todo List Manager

A hands-on workshop (~1–1.5 hours) where you build an MCP (Model Context Protocol) server from scratch using TypeScript. You'll create a **Todo List Manager** that connects to Claude Desktop, learning all three MCP primitives plus MCP Apps:

- **Tools** — Functions that Claude can call (like API endpoints)
- **Resources** — Data that Claude can read (like GET endpoints)
- **Prompts** — Reusable prompt templates (like saved workflows)
- **MCP Apps** — Interactive HTML UIs rendered directly inside the chat

## Prerequisites

- **Node.js 18+** — [Download](https://nodejs.org/)
- **Claude Desktop** — [Download](https://claude.ai/download)
- **Code editor** — VS Code recommended

## Project Structure

```
mcp_app_workshop/
├── package.json           # Dependencies & scripts
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite config for UI bundling (Step 5)
├── src/
│   └── index.ts           # Your working file (edit this!)
├── ui/                    # MCP App UI files (Step 5)
│   ├── todo-app.html      #   HTML entry point
│   └── todo-app.ts        #   Interactive UI logic
├── steps/                 # Complete snapshots for each step
│   ├── step1_hello_world.ts
│   ├── step2_todo_crud.ts
│   ├── step3_resources.ts
│   ├── step4_prompts.ts
│   └── step5_mcp_app.ts
├── WORKSHOP.md            # Full step-by-step tutorial
└── README.md              # This file
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Open `WORKSHOP.md` and follow the step-by-step tutorial.

## Build Commands

| Command | What it does |
|---------|-------------|
| `npm run build` | Compile server TypeScript (`tsc`) — used for Steps 1–4 |
| `npm run build:ui` | Bundle the UI into a single HTML file (`vite`) |
| `npm run build:app` | Build both server and UI — used for Step 5 |
| `npm start` | Run the compiled server (`node dist/index.js`) |

## Falling Behind?

Each file in the `steps/` directory is a complete, standalone snapshot. Copy any step to `src/index.ts` to catch up:

```bash
# Steps 1–4 (stdio transport)
cp steps/step2_todo_crud.ts src/index.ts
npm run build

# Step 5 (HTTP transport + MCP App UI)
cp steps/step5_mcp_app.ts src/index.ts
npm run build:app
```

| File | What it adds |
|------|-------------|
| `steps/step1_hello_world.ts` | Minimal server with one `hello` tool |
| `steps/step2_todo_crud.ts` | Four CRUD tools for managing todos |
| `steps/step3_resources.ts` | `todo://list` resource for reading data |
| `steps/step4_prompts.ts` | `plan-tasks` prompt template |
| `steps/step5_mcp_app.ts` | Interactive todo UI with MCP Apps (HTTP transport) |
