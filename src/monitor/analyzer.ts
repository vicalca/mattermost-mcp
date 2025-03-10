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
    if (message.includes(topicLower)) {
      return true;
    }
    
    // Special handling for TV series
    if (topicLower === 'tv series') {
      // List of popular TV series to check for
      const tvSeries = [
        'breaking bad', 'game of thrones', 'stranger things', 'the office',
        'friends', 'the mandalorian', 'westworld', 'the witcher', 'the crown',
        'black mirror', 'the walking dead', 'better call saul', 'ozark',
        'house of cards', 'narcos', 'peaky blinders', 'the boys', 'succession'
      ];
      
      return tvSeries.some(series => message.includes(series));
    }
    
    // Special handling for Champions League
    if (topicLower === 'champions league') {
      // List of Champions League teams to check for
      const teams = [
        'barcelona', 'real madrid', 'bayern', 'manchester', 'liverpool',
        'juventus', 'psg', 'chelsea', 'dortmund', 'atletico', 'inter',
        'milan', 'arsenal', 'benfica', 'porto', 'ajax', 'napoli'
      ];
      
      return teams.some(team => message.includes(team));
    }
    
    return false;
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
 * @param username Username to mention in the notification
 * @returns Formatted notification message
 */
export function createNotificationMessage(
  relevantPosts: Post[],
  channelName: string,
  username: string
): string {
  if (relevantPosts.length === 0) {
    return '';
  }
  
  const mention = `@${username}`;
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
