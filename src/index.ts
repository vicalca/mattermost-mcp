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
import { loadConfig } from "./config.js";
import { TopicMonitor } from "./monitor/index.js";

async function main() {
  // Check for command-line arguments
  const runMonitoringImmediately = process.argv.includes('--run-monitoring');
  
  console.error("Starting Mattermost MCP Server...");
  
  // Load configuration
  const config = loadConfig();
  
  // Initialize Mattermost client
  let client: MattermostClient;
  try {
    client = new MattermostClient();
    console.error("Successfully initialized Mattermost client");
  } catch (error) {
    console.error("Failed to initialize Mattermost client:", error);
    process.exit(1);
  }
  
  // Initialize and start topic monitor if enabled
  let topicMonitor: TopicMonitor | null = null;
  if (config.monitoring?.enabled) {
    try {
      console.error("Initializing topic monitor...");
      topicMonitor = new TopicMonitor(client, config.monitoring);
      await topicMonitor.start();
      console.error("Topic monitor started successfully");
    } catch (error) {
      console.error("Failed to initialize topic monitor:", error);
      // Continue without monitoring
    }
  } else {
    console.error("Topic monitoring is disabled in configuration");
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
  
  // Run monitoring immediately if requested
  if (runMonitoringImmediately && topicMonitor) {
    console.error("Running monitoring immediately as requested...");
    try {
      await topicMonitor.runNow();
    } catch (error) {
      console.error("Error running monitoring immediately:", error);
    }
  }
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.error("Shutting down Mattermost MCP Server...");
    if (topicMonitor) {
      topicMonitor.stop();
    }
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
