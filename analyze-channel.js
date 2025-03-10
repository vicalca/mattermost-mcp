#!/usr/bin/env node

import { MattermostClient } from './build/client.js';

// Get command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Usage: node analyze-channel.js <channel-name> [message-count]");
  console.log("Example: node analyze-channel.js town-square 20");
  process.exit(1);
}

const channelName = args[0];
const messageCount = parseInt(args[1] || '50', 10); // Default to 50 messages

async function main() {
  try {
    // Initialize Mattermost client
    const client = new MattermostClient();
    console.log(`Analyzing channel: "${channelName}"\n`);
    
    // Get channels to find the specified channel ID
    const channelsResponse = await client.getChannels(100, 0);
    
    // Find the specified channel
    let targetChannelId = null;
    let targetChannel = null;
    
    for (const channel of channelsResponse.channels) {
      if (channel.name === channelName) {
        targetChannelId = channel.id;
        targetChannel = channel;
        break;
      }
    }
    
    if (!targetChannelId) {
      console.error(`Could not find channel: ${channelName}`);
      console.log("Available channels:");
      channelsResponse.channels.forEach(channel => {
        console.log(`- ${channel.name} (${channel.display_name})`);
      });
      process.exit(1);
    }
    
    console.log(`Channel: ${targetChannel.display_name} (${targetChannel.name})`);
    if (targetChannel.purpose) {
      console.log(`Purpose: ${targetChannel.purpose}`);
    }
    console.log(`Reported message count: ${targetChannel.total_msg_count}`);
    console.log("-------------------------------------------\n");
    
    // Get posts from the channel
    const postsResponse = await client.getPostsForChannel(targetChannelId, messageCount, 0);
    
    // Get the posts
    const posts = Object.values(postsResponse.posts || {});
    if (posts.length === 0) {
      console.log(`No posts found in ${channelName} channel`);
      process.exit(0);
    }
    
    // Sort posts by create_at (newest first)
    posts.sort((a, b) => b.create_at - a.create_at);
    
    // Create a map to store usernames
    const usernames = new Map();
    
    // Get usernames for all user IDs
    for (const post of posts) {
      if (!usernames.has(post.user_id)) {
        try {
          const userProfile = await client.getUserProfile(post.user_id);
          usernames.set(post.user_id, userProfile.username);
        } catch (error) {
          usernames.set(post.user_id, post.user_id); // Use ID as fallback
        }
      }
    }
    
    // Analyze posts
    const userMessages = posts.filter(post => !post.message.includes('joined the channel'));
    const systemMessages = posts.filter(post => post.message.includes('joined the channel'));
    const messagesByUser = new Map();
    
    // Count messages by user
    for (const post of userMessages) {
      const username = usernames.get(post.user_id) || post.user_id;
      if (!messagesByUser.has(username)) {
        messagesByUser.set(username, []);
      }
      messagesByUser.get(username).push(post);
    }
    
    // Display statistics
    console.log(`Total messages found: ${posts.length}`);
    console.log(`User messages: ${userMessages.length}`);
    console.log(`System messages: ${systemMessages.length}`);
    console.log("\nMessages by user:");
    
    for (const [username, userPosts] of messagesByUser.entries()) {
      console.log(`- @${username}: ${userPosts.length} messages`);
    }
    
    console.log("\nLatest messages:");
    console.log("-------------------------------------------");
    
    // Display the latest 5 posts
    for (let i = 0; i < Math.min(5, posts.length); i++) {
      const post = posts[i];
      const username = usernames.get(post.user_id) || post.user_id;
      
      console.log(`[${i + 1}] @${username} - ${new Date(post.create_at).toLocaleString()}`);
      console.log(post.message);
      console.log("-------------------------------------------");
    }
    
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
