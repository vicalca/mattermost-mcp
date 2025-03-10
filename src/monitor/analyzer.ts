import { Post } from '../types.js';

/**
 * Analyzes a message to determine if it contains any of the specified topics
 * @param post The post to analyze
 * @param topics Array of topics to look for
 * @returns True if the post contains any of the topics, false otherwise
 */
export function analyzePost(post: Post, topics: string[]): boolean {
  const message = post.message.toLowerCase();
  
  // Check if any of the topics are mentioned in the message
  return topics.some(topic => {
    const topicLower = topic.toLowerCase();
    
    // Check for exact match or as part of a word
    return message.includes(topicLower);
  });
}

/**
 * Analyzes a batch of posts to find those that match the specified topics
 * @param posts Array of posts to analyze
 * @param topics Array of topics to look for
 * @returns Array of posts that match the topics
 */
export function findRelevantPosts(posts: Post[], topics: string[]): Post[] {
  return posts.filter(post => analyzePost(post, topics));
}

/**
 * Creates a notification message for relevant posts
 * @param relevantPosts Array of posts that match the topics
 * @param channelName Name of the channel where the posts were found
 * @param userId User ID to mention in the notification
 * @returns Formatted notification message
 */
export function createNotificationMessage(
  relevantPosts: Post[],
  channelName: string,
  userId: string
): string {
  if (relevantPosts.length === 0) {
    return '';
  }
  
  const mention = `<@${userId}>`;
  let message = `${mention} I found discussion about topics you're interested in!\n\n`;
  message += `**Channel:** ${channelName}\n\n`;
  
  // Add information about each relevant post
  relevantPosts.forEach((post, index) => {
    // Format the timestamp
    const timestamp = new Date(post.create_at).toLocaleString();
    
    message += `**Message ${index + 1}** (${timestamp}):\n`;
    message += `${post.message}\n\n`;
  });
  
  return message;
}
