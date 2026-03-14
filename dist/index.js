import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerAppTool, registerAppResource, RESOURCE_MIME_TYPE, } from "@modelcontextprotocol/ext-apps/server";
import express from "express";
import cors from "cors";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
let todos = [];
let nextId = 1;
// ---------- MCP Server ----------
const server = new McpServer({
    name: "todo-mcp-server",
    version: "1.0.0",
});
// ---------- Tools ----------
// Tool: add_todo
server.tool("add_todo", "Add a new todo item", { title: z.string().describe("The title of the todo item") }, async ({ title }) => {
    const todo = {
        id: nextId++,
        title,
        completed: false,
        createdAt: new Date().toISOString(),
    };
    todos.push(todo);
    return {
        content: [{ type: "text", text: `Added todo #${todo.id}: "${todo.title}"` }],
    };
});
// Tool: list_todos
server.tool("list_todos", "List all todo items", {}, async () => {
    if (todos.length === 0) {
        return {
            content: [{ type: "text", text: "No todos yet. Add one with the add_todo tool!" }],
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
server.tool("complete_todo", "Mark a todo item as completed", { id: z.number().describe("The ID of the todo to complete") }, async ({ id }) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) {
        return {
            content: [{ type: "text", text: `Todo #${id} not found.` }],
        };
    }
    todo.completed = true;
    return {
        content: [{ type: "text", text: `Completed todo #${id}: "${todo.title}"` }],
    };
});
// Tool: delete_todo
server.tool("delete_todo", "Delete a todo item", { id: z.number().describe("The ID of the todo to delete") }, async ({ id }) => {
    const index = todos.findIndex((t) => t.id === id);
    if (index === -1) {
        return {
            content: [{ type: "text", text: `Todo #${id} not found.` }],
        };
    }
    const removed = todos.splice(index, 1)[0];
    return {
        content: [{ type: "text", text: `Deleted todo #${id}: "${removed.title}"` }],
    };
});
// ---------- Resources ----------
// Resource: todo://list
server.resource("todo-list", "todo://list", { description: "A JSON list of all current todos" }, async (uri) => {
    return {
        contents: [
            {
                uri: uri.href,
                mimeType: "application/json",
                text: JSON.stringify(todos, null, 2),
            },
        ],
    };
});
// ---------- Prompts ----------
// Prompt: plan-tasks
server.prompt("plan-tasks", "Create an action plan based on a goal and current todos", { goal: z.string().describe("The goal you want to achieve") }, async ({ goal }) => {
    const todoSummary = todos.length === 0
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
                role: "user",
                content: {
                    type: "text",
                    text: `Here are my current todos:\n\n${todoSummary}\n\nMy goal: ${goal}\n\nPlease analyze my current todos and create an action plan to achieve this goal. Suggest new todos to add, todos to prioritize, and any todos that might not be relevant to the goal.`,
                },
            },
        ],
    };
});
// ---------- MCP App: Interactive Todo UI ----------
const todoAppResourceUri = "ui://todo-app/todo-app.html";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// App Tool: show_todos — renders an interactive todo dashboard
registerAppTool(server, "show_todos", {
    title: "Show Todos",
    description: "Display an interactive todo list dashboard where you can add, complete, and delete todos visually.",
    inputSchema: {},
    _meta: { ui: { resourceUri: todoAppResourceUri } },
}, async () => {
    return {
        content: [{ type: "text", text: JSON.stringify(todos) }],
    };
});
// App Resource: serves the bundled HTML UI
registerAppResource(server, todoAppResourceUri, todoAppResourceUri, { mimeType: RESOURCE_MIME_TYPE }, async () => {
    const html = await fs.readFile(path.join(__dirname, "ui", "todo-app.html"), "utf-8");
    return {
        contents: [
            { uri: todoAppResourceUri, mimeType: RESOURCE_MIME_TYPE, text: html },
        ],
    };
});
// ---------- Start Server (HTTP Transport) ----------
const app = express();
app.use(cors());
app.use(express.json());
app.post("/mcp", async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
    });
    res.on("close", () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
});
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Todo MCP App Server running at http://localhost:${PORT}/mcp`);
});
