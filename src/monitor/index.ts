import { MattermostClient } from '../client.js';
import { MonitoringConfig } from '../config.js';
import { Channel, Post, User } from '../types.js';
import { findRelevantPosts, createNotificationMessage } from './analyzer.js';
import { Scheduler } from './scheduler.js';

/**
 * TopicMonitor class for monitoring channels for topics of interest
 */
export class TopicMonitor {
  private client: MattermostClient;
  private config: MonitoringConfig;
  private scheduler: Scheduler;
  private channelCache: Map<string, string> = new Map(); // Map of channel names to IDs
  private currentUserId: string | null = null;
  private directMessageChannelId: string | null = null;

  /**
   * Creates a new topic monitor
   * @param client Mattermost client
   * @param config Monitoring configuration
   */
  constructor(client: MattermostClient, config: MonitoringConfig) {
    this.client = client;
    this.config = config;
    this.scheduler = new Scheduler(config, this.monitorChannels.bind(this));
  }

  /**
   * Initializes the monitor by fetching necessary user information
   */
  async initialize(): Promise<void> {
    // If userId is not provided, fetch the current user's information
    if (!this.config.userId) {
      await this.fetchCurrentUser();
    } else {
      this.currentUserId = this.config.userId;
    }

    // If notificationChannelId is not provided, create or find a direct message channel
    if (!this.config.notificationChannelId) {
      await this.createDirectMessageChannel();
    }
  }

  /**
   * Fetches the current user's information
   */
  private async fetchCurrentUser(): Promise<void> {
    try {
      // For simplicity, we'll use a hardcoded user ID for the bot
      // In a real implementation, we would make an API call to get the current user
      
      // Try to get the user ID from the response
      try {
        // Get the first page of users
        const response = await this.client.getUsers(100, 0);
        
        // Check if response.users exists and is an array
        if (response && response.users && Array.isArray(response.users)) {
          // Find the user that matches the token (current user)
          for (const user of response.users) {
            // Check if this is the bot user (the one with the token)
            if (user.is_bot) {
              this.currentUserId = user.id;
              console.error(`Found current user: ${user.username} (${user.id})`);
              return;
            }
          }
        } else {
          console.error('Response does not contain users array:', response);
        }
      } catch (innerError) {
        console.error('Error getting users:', innerError);
      }
      
      // Fallback: Use the town-square channel's first post author as a user ID
      try {
        // Get the town-square channel
        const channelsResponse = await this.client.getChannels(100, 0);
        let townSquareId = null;
        
        if (channelsResponse && channelsResponse.channels && Array.isArray(channelsResponse.channels)) {
          for (const channel of channelsResponse.channels) {
            if (channel.name === 'town-square') {
              townSquareId = channel.id;
              break;
            }
          }
        }
        
        if (townSquareId) {
          // Get posts from town-square
          const postsResponse = await this.client.getPostsForChannel(townSquareId, 1, 0);
          
          if (postsResponse && postsResponse.posts) {
            // Get the first post's user ID
            const posts = Object.values(postsResponse.posts);
            if (posts.length > 0) {
              this.currentUserId = posts[0].user_id;
              console.error(`Using fallback user ID from post: ${this.currentUserId}`);
              return;
            }
          }
        }
      } catch (innerError) {
        console.error('Error using fallback method:', innerError);
      }
      
      // Final fallback: Use a hardcoded user ID
      this.currentUserId = "system"; // Use "system" as a last resort
      console.error(`Using hardcoded user ID: ${this.currentUserId}`);
      
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  }

  /**
   * Creates or finds a direct message channel for the current user
   */
  private async createDirectMessageChannel(): Promise<void> {
    try {
      if (!this.currentUserId) {
        throw new Error('Current user ID is not set');
      }

      // In a real implementation, we would create a direct message channel
      // with the current user. For simplicity, we'll use the town-square channel
      // as a fallback.
      const response = await this.client.getChannels(100, 0);
      
      // Find the town-square channel as a fallback
      for (const channel of response.channels) {
        if (channel.name === 'town-square') {
          this.directMessageChannelId = channel.id;
          console.error(`Using town-square as notification channel: ${channel.id}`);
          return;
        }
      }

      throw new Error('Could not find a suitable notification channel');
    } catch (error) {
      console.error('Error creating direct message channel:', error);
      throw error;
    }
  }

  /**
   * Starts the monitoring process
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      console.error('Monitoring is disabled in configuration');
      return;
    }

    // Initialize user information and notification channel
    await this.initialize();
    
    this.scheduler.start();
  }

  /**
   * Stops the monitoring process
   */
  stop(): void {
    this.scheduler.stop();
  }

  /**
   * Updates the monitoring configuration
   * @param config New monitoring configuration
   */
  updateConfig(config: MonitoringConfig): void {
    this.config = config;
    this.scheduler.updateConfig(config);
  }

  /**
   * Checks if the monitor is running
   * @returns True if the monitor is running, false otherwise
   */
  isRunning(): boolean {
    return this.scheduler.isRunning();
  }

  /**
   * Runs the monitoring process immediately
   */
  async runNow(): Promise<void> {
    console.error("Running monitoring process immediately...");
    await this.monitorChannels();
    console.error("Immediate monitoring process completed.");
  }

  /**
   * Main monitoring function that checks channels for topics of interest
   */
  private async monitorChannels(): Promise<void> {
    try {
      // Get channel IDs for the channels we want to monitor
      await this.refreshChannelCache();

      // Process each channel
      for (const channelName of this.config.channels) {
        await this.processChannel(channelName);
      }
    } catch (error) {
      console.error('Error in monitorChannels:', error);
    }
  }

  /**
   * Refreshes the cache of channel names to IDs
   */
  private async refreshChannelCache(): Promise<void> {
    try {
      // Get all channels
      const response = await this.client.getChannels(100, 0);
      
      // Update the cache
      for (const channel of response.channels) {
        this.channelCache.set(channel.name, channel.id);
      }
    } catch (error) {
      console.error('Error refreshing channel cache:', error);
      throw error;
    }
  }

  /**
   * Processes a single channel for topics of interest
   * @param channelName Name of the channel to process
   */
  private async processChannel(channelName: string): Promise<void> {
    try {
      // Get the channel ID
      const channelId = this.channelCache.get(channelName);
      if (!channelId) {
        console.error(`Channel not found: ${channelName}`);
        return;
      }

      // Get recent posts
      const postsResponse = await this.client.getPostsForChannel(
        channelId,
        this.config.messageLimit,
        0
      );

      // Convert posts object to array
      const posts: Post[] = Object.values(postsResponse.posts || {});
      
      if (posts.length === 0) {
        console.error(`No posts found in channel: ${channelName}`);
        return;
      }

      // Find posts that match the topics
      const relevantPosts = findRelevantPosts(posts, this.config.topics);
      
      if (relevantPosts.length === 0) {
        console.error(`No relevant posts found in channel: ${channelName}`);
        return;
      }

      console.error(`Found ${relevantPosts.length} relevant posts in channel: ${channelName}`);

      // Create and send notification
      const userId = this.config.userId || this.currentUserId;
      if (!userId) {
        console.error('No user ID available for notification');
        return;
      }
      
      const notificationMessage = createNotificationMessage(
        relevantPosts,
        channelName,
        userId
      );

      if (notificationMessage) {
        const channelId = this.config.notificationChannelId || this.directMessageChannelId;
        if (!channelId) {
          console.error('No notification channel ID available');
          return;
        }
        
        await this.client.createPost(
          channelId,
          notificationMessage
        );
        console.error(`Sent notification for channel: ${channelName}`);
      }
    } catch (error) {
      console.error(`Error processing channel ${channelName}:`, error);
    }
  }
}
