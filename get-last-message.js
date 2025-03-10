#!/usr/bin/env node

import { MattermostClient } from './build/client.js';
import { loadConfig } from './build/config.js';

// Get command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Usage: node get-last-message.js <channel-name>");
  console.log("Example: node get-last-message.js town-square");
  process.exit(1);
}

const channelName = args[0];

async function main() {
  try {
    // Initialize Mattermost client
    const client = new MattermostClient();
    console.log("Successfully initialized Mattermost client");
    
    // Get channels to find the specified channel ID
    console.log("Fetching channels...");
    const channelsResponse = await client.getChannels(100, 0);
    
    // Find the specified channel
    let channelId = null;
    for (const channel of channelsResponse.channels) {
      if (channel.name === channelName) {
        channelId = channel.id;
        console.log(`Found channel ${channelName}: ${channel.id}`);
        break;
      }
    }
    
    if (!channelId) {
      console.error(`Could not find channel: ${channelName}`);
      console.log("Available channels:");
      channelsResponse.channels.forEach(channel => {
        console.log(`- ${channel.name} (${channel.display_name})`);
      });
      process.exit(1);
    }
    
    // Get posts from the channel
    console.log(`Fetching posts from ${channelName} channel...`);
    const postsResponse = await client.getPostsForChannel(channelId, 1, 0);
    
    // Get the last post
    const posts = Object.values(postsResponse.posts || {});
    if (posts.length === 0) {
      console.log(`No posts found in ${channelName} channel`);
      process.exit(0);
    }
    
    // Sort posts by create_at (newest first)
    posts.sort((a, b) => b.create_at - a.create_at);
    
    // Display the last post
    const lastPost = posts[0];
    console.log(`\n=== Last Message in ${channelName} Channel ===`);
    console.log(`From: ${lastPost.user_id}`);
    console.log(`Time: ${new Date(lastPost.create_at).toLocaleString()}`);
    console.log(`Message: ${lastPost.message}`);
    console.log("==========================================\n");
    
    // Try to get the username for the user ID
    try {
      const userProfile = await client.getUserProfile(lastPost.user_id);
      console.log(`Username: ${userProfile.username}`);
    } catch (error) {
      console.error("Could not get username for user ID:", error);
    }
    
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
