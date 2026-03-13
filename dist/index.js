import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
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
// ---------- Start Server ----------
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Todo MCP Server running on stdio");
}
main().catch(console.error);
