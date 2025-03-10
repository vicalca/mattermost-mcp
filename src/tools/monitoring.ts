import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { MattermostClient } from "../client.js";
import { TopicMonitor } from "../monitor/index.js";
import { loadConfig } from "../config.js";

// Global reference to the TopicMonitor instance
let topicMonitorInstance: TopicMonitor | null = null;

// Set the TopicMonitor instance
export function setTopicMonitorInstance(instance: TopicMonitor): void {
  topicMonitorInstance = instance;
}

// Tool definition for running monitoring immediately
export const runMonitoringTool: Tool = {
  name: "mattermost_run_monitoring",
  description: "Run the topic monitoring process immediately",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};

// Handler for the run monitoring tool
export async function handleRunMonitoring(client: MattermostClient, args: any) {
  try {
    if (!topicMonitorInstance) {
      // If no instance is set, create a new one
      const config = loadConfig();
      if (!config.monitoring?.enabled) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "Topic monitoring is disabled in configuration",
              }),
            },
          ],
          isError: true,
        };
      }
      
      topicMonitorInstance = new TopicMonitor(client, config.monitoring);
      await topicMonitorInstance.start();
    }
    
    // Run the monitoring process
    await topicMonitorInstance.runNow();
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            message: "Topic monitoring process executed successfully",
          }),
        },
      ],
    };
  } catch (error) {
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
}
