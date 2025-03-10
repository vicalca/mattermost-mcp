#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequest,
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { tools, executeTool } from "./tools/index.js";
import { MattermostClient } from "./client.js";

async function main() {
  console.error("Starting Mattermost MCP Server...");
  
  // Initialize Mattermost client
  let client: MattermostClient;
  try {
    client = new MattermostClient();
    console.error("Successfully initialized Mattermost client");
  } catch (error) {
    console.error("Failed to initialize Mattermost client:", error);
    process.exit(1);
  }
  
  // Initialize MCP server
  const server = new Server(
    {
      name: "Mattermost MCP Server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tool listing handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    console.error("Received ListToolsRequest");
    return {
      tools,
    };
  });

  // Register tool execution handler
  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    console.error(`Received CallToolRequest for tool: ${request.params.name}`);
    
    try {
      if (!request.params.arguments) {
        throw new Error("No arguments provided");
      }

      return await executeTool(client, request.params.name, request.params.arguments);
    } catch (error) {
      console.error("Error executing tool:", error);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: error instanceof Error ? error.message : String(error),
            }),
          },
        ],
        isError: true,
      };
    }
  });

  // Connect to transport
  const transport = new StdioServerTransport();
  console.error("Connecting server to transport...");
  await server.connect(transport);

  console.error("Mattermost MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
