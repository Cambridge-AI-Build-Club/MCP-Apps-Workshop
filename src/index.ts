import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create an MCP server
const server = new McpServer({
  name: "todo-mcp-server",
  version: "1.0.0",
});

// Register a simple "hello" tool
server.tool("hello", "Say hello to someone", { name: z.string() }, async ({ name }) => {
  return {
    content: [{ type: "text", text: `Hello, ${name}! Welcome to MCP! 🎉` }],
  };
});

// Start the server using stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Todo MCP Server running on stdio");
}

main().catch(console.error);
