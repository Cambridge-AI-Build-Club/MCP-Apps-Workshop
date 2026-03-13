# MCP App Workshop: Build a Todo List Manager

> **Duration:** 1 hour | **Level:** Intermediate | **Language:** TypeScript

In this workshop, you'll build a fully functional MCP server that manages a todo list. By the end, you'll understand all three MCP primitives — **Tools**, **Resources**, and **Prompts** — and have a working server connected to Claude Desktop.

---

## Table of Contents

1. [What is MCP?](#section-0-what-is-mcp)
2. [Project Setup](#section-1-project-setup)
3. [Step 1: Hello World Tool](#section-2-step-1-hello-world-tool)
4. [Step 2: Todo CRUD Tools](#section-3-step-2-todo-crud-tools)
5. [Step 3: Resources](#section-4-step-3-resources)
6. [Step 4: Prompt Templates](#section-5-step-4-prompt-templates)
7. [Wrap-up & Next Steps](#section-6-wrap-up--next-steps)
8. [Appendix: Troubleshooting](#appendix-troubleshooting)

---

## Section 0: What is MCP?

**Model Context Protocol (MCP)** is an open standard that lets AI applications (like Claude Desktop) connect to external tools and data sources. Think of it as a **USB-C port for AI** — a single standardized interface instead of custom integrations for every tool.

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Claude Desktop │     │   MCP Client    │     │   MCP Server    │
│   (Host)         │────▶│   (built into   │────▶│   (your code!)  │
│                  │     │    the host)     │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

The **Host** (Claude Desktop) has a built-in **Client** that talks to your **Server** via a standardized protocol.

### The Three MCP Primitives

| Primitive | Direction | Analogy | Example |
|-----------|-----------|---------|---------|
| **Tools** | Client → Server | POST endpoints | "Add a todo", "Delete a todo" |
| **Resources** | Client → Server | GET endpoints | "Read the todo list" |
| **Prompts** | User-initiated | Saved templates | "Plan my tasks for this goal" |

- **Tools** let Claude *do* things (actions with side effects)
- **Resources** let Claude *read* things (data without side effects)
- **Prompts** are reusable templates that pre-fill conversations with structured context

---

## Section 1: Project Setup

### Prerequisites

Make sure you have installed:
- **Node.js 18+** — Check with `node --version`
- **Claude Desktop** — [Download here](https://claude.ai/download)
- **Code editor** — VS Code recommended

### 1.1 Install Dependencies

In the workshop directory, run:

```bash
npm install
```

This installs:
- `@modelcontextprotocol/sdk` — The official MCP SDK for TypeScript
- `zod` — Schema validation library (used by the MCP SDK)
- `typescript` — TypeScript compiler

### 1.2 Understand the Project Structure

```
mcp_app_workshop/
├── package.json           # Dependencies & scripts
├── tsconfig.json          # TypeScript configuration
├── src/
│   └── index.ts           # Your working file (edit this!)
├── steps/                 # Complete snapshots for each step
│   ├── step1_hello_world.ts
│   ├── step2_todo_crud.ts
│   ├── step3_resources.ts
│   └── step4_prompts.ts
├── WORKSHOP.md            # This file
└── README.md              # Quick-start overview
```

> **Falling behind?** Copy any step file to `src/index.ts` to catch up:
> ```bash
> cp steps/step2_todo_crud.ts src/index.ts
> npm run build
> ```

### 1.3 Configure Claude Desktop

You need to tell Claude Desktop about your MCP server. Open the Claude Desktop configuration file:

**macOS:**
```bash
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows:**
```bash
code %APPDATA%\Claude\claude_desktop_config.json
```

Add your server configuration (create the file if it doesn't exist):

```json
{
  "mcpServers": {
    "todo-mcp-server": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/mcp_app_workshop/dist/index.js"]
    }
  }
}
```

> **Important:** Replace `/ABSOLUTE/PATH/TO/` with the actual absolute path to your project directory. You can find it by running `pwd` in the workshop directory.

Save the file. We'll restart Claude Desktop after our first build.

---

## Section 2: Step 1 — Hello World Tool

Let's build the simplest possible MCP server: a single tool that says hello.

### 2.1 Write the Code

Open `src/index.ts` and make sure it contains:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create an MCP server
const server = new McpServer({
  name: "todo-mcp-server",
  version: "1.0.0",
});

// Register a simple "hello" tool
server.tool(
  "hello",
  "Say hello to someone",
  { name: z.string() },
  async ({ name }) => {
    return {
      content: [{ type: "text", text: `Hello, ${name}! Welcome to MCP! 🎉` }],
    };
  }
);

// Start the server using stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Todo MCP Server running on stdio");
}

main().catch(console.error);
```

### 2.2 Key Concepts

Let's break down what's happening:

1. **`McpServer`** — Creates a new MCP server instance with a name and version.

2. **`server.tool(name, description, schema, handler)`** — Registers a tool with:
   - `name` — Unique identifier for the tool
   - `description` — Human-readable description (Claude uses this to decide when to call it)
   - `schema` — Zod schema defining the input parameters
   - `handler` — Async function that runs when the tool is called

3. **`StdioServerTransport`** — Communicates via stdin/stdout (how Claude Desktop talks to MCP servers).

4. **Return format** — Tools return a `content` array. Each item has a `type` (usually `"text"`) and the actual content.

> **Why `console.error` instead of `console.log`?** The stdio transport uses stdout for MCP protocol messages. Using `console.log` would corrupt the protocol. Always use `console.error` for debug output!

### 2.3 Build & Test

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

Now restart Claude Desktop:
- **macOS:** Cmd+Q, then reopen
- **Windows:** Right-click tray icon → Quit, then reopen

**Verify it works:**
1. Open a new conversation in Claude Desktop
2. Look for the **hammer icon** (🔨) in the input area — this means tools are available
3. Click the hammer to see your `hello` tool listed
4. Type: **"Say hello to Alice"**
5. Claude should call your `hello` tool and display the greeting!

> **Don't see the hammer?** Check [Troubleshooting](#appendix-troubleshooting) at the end.

---

## Section 3: Step 2 — Todo CRUD Tools

Now let's build something useful: a full CRUD (Create, Read, Update, Delete) todo manager.

### 3.1 Add the Data Model

First, add the data model at the top of `src/index.ts` (after the imports):

```typescript
// ---------- Data Model ----------

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
}

let todos: Todo[] = [];
let nextId = 1;
```

We're using an in-memory array for simplicity. The data resets when the server restarts — that's fine for a workshop!

### 3.2 Replace the Hello Tool with CRUD Tools

Replace the `hello` tool registration with these four tools:

```typescript
// Tool: add_todo
server.tool(
  "add_todo",
  "Add a new todo item",
  { title: z.string().describe("The title of the todo item") },
  async ({ title }) => {
    const todo: Todo = {
      id: nextId++,
      title,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    todos.push(todo);
    return {
      content: [
        { type: "text", text: `Added todo #${todo.id}: "${todo.title}"` },
      ],
    };
  }
);

// Tool: list_todos
server.tool("list_todos", "List all todo items", {}, async () => {
  if (todos.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: "No todos yet. Add one with the add_todo tool!",
        },
      ],
    };
  }

  const formatted = todos
    .map((t) => {
      const status = t.completed ? "✅" : "⬜";
      return `${status} #${t.id}: ${t.title} (created: ${t.createdAt})`;
    })
    .join("\n");

  return {
    content: [{ type: "text", text: formatted }],
  };
});

// Tool: complete_todo
server.tool(
  "complete_todo",
  "Mark a todo item as completed",
  { id: z.number().describe("The ID of the todo to complete") },
  async ({ id }) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) {
      return {
        content: [{ type: "text", text: `Todo #${id} not found.` }],
      };
    }
    todo.completed = true;
    return {
      content: [
        { type: "text", text: `Completed todo #${id}: "${todo.title}"` },
      ],
    };
  }
);

// Tool: delete_todo
server.tool(
  "delete_todo",
  "Delete a todo item",
  { id: z.number().describe("The ID of the todo to delete") },
  async ({ id }) => {
    const index = todos.findIndex((t) => t.id === id);
    if (index === -1) {
      return {
        content: [{ type: "text", text: `Todo #${id} not found.` }],
      };
    }
    const removed = todos.splice(index, 1)[0];
    return {
      content: [
        { type: "text", text: `Deleted todo #${id}: "${removed.title}"` },
      ],
    };
  }
);
```

> **Falling behind?** Copy the complete file:
> ```bash
> cp steps/step2_todo_crud.ts src/index.ts
> ```

### 3.3 Key Concepts

- **`.describe()`** on Zod schemas — Adds descriptions that help Claude understand what values to provide
- **Empty schema `{}`** — The `list_todos` tool takes no parameters
- **Error handling** — We return error messages as text content rather than throwing exceptions. This lets Claude handle the error gracefully.

### 3.4 Build & Test

```bash
npm run build
```

Restart Claude Desktop (Cmd+Q → reopen).

**Try these prompts:**

1. **"Add three todos: buy groceries, clean the house, write a blog post"**
   - Claude should call `add_todo` three times

2. **"Show me my todo list"**
   - Claude should call `list_todos`

3. **"Mark the first one as done"**
   - Claude should call `complete_todo` with the correct ID

4. **"Delete the blog post todo"**
   - Claude should call `delete_todo`

5. **"What's left on my list?"**
   - Claude should call `list_todos` again

Notice how Claude naturally figures out which tool to use and what parameters to pass. The tool descriptions and Zod schemas guide its decisions.

---

## Section 4: Step 3 — Resources

So far we've used **Tools** — functions that Claude calls to perform actions. Now let's add a **Resource** — structured data that Claude can read.

### 4.1 Tools vs Resources

| | Tools | Resources |
|---|---|---|
| **Purpose** | Perform actions | Expose data |
| **Analogy** | POST/PUT/DELETE | GET |
| **Side effects** | Yes (create, update, delete) | No (read-only) |
| **When to use** | Changing state | Reading state |

Our `list_todos` tool works, but it returns human-readable text. A resource can return structured JSON that Claude can work with more effectively.

### 4.2 Add the Resource

Add this code after your tool registrations (before the `main()` function):

```typescript
// ---------- Resources ----------

// Resource: todo://list
server.resource(
  "todo-list",
  "todo://list",
  { description: "A JSON list of all current todos" },
  async (uri) => {
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(todos, null, 2),
        },
      ],
    };
  }
);
```

> **Falling behind?** Copy the complete file:
> ```bash
> cp steps/step3_resources.ts src/index.ts
> ```

### 4.3 Key Concepts

**`server.resource(name, uri, options, handler)`** registers a resource with:

- **`name`** — Unique identifier (used internally)
- **`uri`** — The resource URI (uses a custom `todo://` scheme)
- **`options`** — Metadata like description
- **`handler`** — Async function returning the resource contents

The handler returns a `contents` array where each item specifies:
- `uri` — The resource URI
- `mimeType` — The content type (`application/json`, `text/plain`, etc.)
- `text` — The actual content

### 4.4 Build & Test

```bash
npm run build
```

Restart Claude Desktop (Cmd+Q → reopen).

**How to test resources:**
1. In Claude Desktop, look for the **plug icon** (🔌) or resource attachment button
2. Click it to browse available resources
3. You should see `todo://list` — click to attach it to the conversation
4. Claude can now see the raw JSON data from your todo list

**Try this flow:**
1. First add some todos: **"Add todos: learn MCP, build a demo, write docs"**
2. Then attach the `todo://list` resource
3. Ask: **"Analyze my todo list and suggest priorities"**

Claude now has the full structured data to work with, not just a formatted text summary.

---

## Section 5: Step 4 — Prompt Templates

The last MCP primitive is **Prompts** — reusable templates that pre-fill conversations with structured context.

### 5.1 What Are Prompts?

Prompts are like saved workflows. Instead of the user typing a complex prompt every time, they select a prompt template and fill in a few parameters. The server generates a complete, structured message.

| Feature | User types manually | Prompt template |
|---------|-------------------|-----------------|
| Consistency | Varies each time | Always structured |
| Context | User must remember | Server includes relevant data |
| Ease of use | Must know what to ask | Just fill in parameters |

### 5.2 Add the Prompt

Add this code after your resource registration:

```typescript
// ---------- Prompts ----------

// Prompt: plan-tasks
server.prompt(
  "plan-tasks",
  "Create an action plan based on a goal and current todos",
  { goal: z.string().describe("The goal you want to achieve") },
  async ({ goal }) => {
    const todoSummary =
      todos.length === 0
        ? "No todos yet."
        : todos
            .map((t) => {
              const status = t.completed ? "[done]" : "[pending]";
              return `- ${status} #${t.id}: ${t.title}`;
            })
            .join("\n");

    return {
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Here are my current todos:\n\n${todoSummary}\n\nMy goal: ${goal}\n\nPlease analyze my current todos and create an action plan to achieve this goal. Suggest new todos to add, todos to prioritize, and any todos that might not be relevant to the goal.`,
          },
        },
      ],
    };
  }
);
```

> **Falling behind?** Copy the complete file:
> ```bash
> cp steps/step4_prompts.ts src/index.ts
> ```

### 5.3 Key Concepts

**`server.prompt(name, description, schema, handler)`** registers a prompt with:

- **`name`** — Unique identifier
- **`description`** — What the prompt does
- **`schema`** — Zod schema for prompt parameters
- **`handler`** — Async function that returns structured messages

The handler returns a `messages` array — each message has a `role` (`"user"` or `"assistant"`) and `content`. This is powerful because:

1. **Dynamic context** — The prompt includes current todos automatically
2. **Structured instructions** — Claude gets a well-formatted request every time
3. **Parameterized** — The user just provides a goal; the server handles the rest

### 5.4 Build & Test

```bash
npm run build
```

Restart Claude Desktop (Cmd+Q → reopen).

**How to test prompts:**
1. In Claude Desktop, look for the **prompt icon** or slash command menu
2. You should see `plan-tasks` listed
3. Click it — you'll be prompted to enter a `goal`
4. Enter something like: **"Launch my personal website"**
5. The prompt template generates a full message with your current todos and the goal

**Try this flow:**
1. Add some todos first: **"Add todos: buy domain name, design landing page, set up hosting, write about page"**
2. Select the `plan-tasks` prompt
3. Enter goal: **"Launch my personal website by end of month"**
4. Claude will analyze your todos and create a prioritized action plan!

---

## Section 6: Wrap-up & Next Steps

Congratulations! You've built a complete MCP server with all three primitives:

| What you built | Primitive | Purpose |
|----------------|-----------|---------|
| `add_todo`, `list_todos`, `complete_todo`, `delete_todo` | **Tools** | Perform actions |
| `todo://list` | **Resource** | Expose structured data |
| `plan-tasks` | **Prompt** | Reusable template |

### What You Learned

- How MCP's architecture works (Host → Client → Server)
- How to create and register Tools with Zod schema validation
- How to expose Resources for structured data access
- How to build Prompt templates with dynamic context
- How to configure and test MCP servers with Claude Desktop

### Extension Ideas

Want to keep building? Try these challenges:

1. **Persistence** — Save todos to a JSON file so they survive restarts
2. **Priority levels** — Add a `priority` field (high/medium/low) to todos
3. **Due dates** — Add due dates and a resource that shows overdue items
4. **Tags** — Add a tagging system and filter tools
5. **Resource templates** — Create `todo://item/{id}` to read individual todos
6. **Multiple lists** — Support separate todo lists (work, personal, etc.)

### Further Resources

- [MCP Documentation](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Specification](https://spec.modelcontextprotocol.io)
- [Example MCP Servers](https://github.com/modelcontextprotocol/servers)

---

## Appendix: Troubleshooting

### The hammer icon doesn't appear in Claude Desktop

1. **Check your config file path:**
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. **Check your config syntax** — Make sure it's valid JSON:
   ```json
   {
     "mcpServers": {
       "todo-mcp-server": {
         "command": "node",
         "args": ["/ABSOLUTE/PATH/TO/mcp_app_workshop/dist/index.js"]
       }
     }
   }
   ```

3. **Check the path is absolute** — Relative paths won't work. Use `pwd` to get the full path.

4. **Check the build output exists:**
   ```bash
   ls dist/index.js
   ```
   If not, run `npm run build`.

5. **Restart Claude Desktop completely** — Cmd+Q (not just close the window), then reopen.

### Build errors

- **"Cannot find module"** — Run `npm install` first.
- **Type errors** — Make sure you're using the exact code from the workshop. When in doubt, copy from `steps/`.

### Tool calls fail or return errors

1. **Check Claude Desktop logs:**
   - macOS: `~/Library/Logs/Claude/mcp*.log`
   - Look for error messages from your server

2. **Test your server manually:**
   ```bash
   echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node dist/index.js
   ```
   You should see a JSON response (not an error).

3. **Check console.error output** — Remember, `console.log` will break the stdio transport. Make sure all debug logging uses `console.error`.

### "Server disconnected" errors

This usually means your server crashed. Common causes:
- Using `console.log` instead of `console.error`
- Unhandled exceptions in tool handlers
- Import errors (wrong path or missing dependency)

Check the MCP logs for the specific error.
