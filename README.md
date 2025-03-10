# Mattermost MCP Server

MCP Server for the Mattermost API, enabling Claude and other MCP clients to interact with Mattermost workspaces.

## Features

This MCP server provides tools for interacting with Mattermost, including:

### Channel Tools
- `mattermost_list_channels`: List public channels in the workspace
- `mattermost_get_channel_history`: Get recent messages from a channel

### Message Tools
- `mattermost_post_message`: Post a new message to a channel
- `mattermost_reply_to_thread`: Reply to a specific message thread
- `mattermost_add_reaction`: Add an emoji reaction to a message
- `mattermost_get_thread_replies`: Get all replies in a thread

### User Tools
- `mattermost_get_users`: Get a list of users in the workspace
- `mattermost_get_user_profile`: Get detailed profile information for a user

## Setup

1. Clone this repository:
```bash
git clone https://github.com/yourusername/mattermost-mcp.git
cd mattermost-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Configure the server:
Edit `config.json` with your Mattermost API details:
```json
{
  "mattermostUrl": "https://your-mattermost-instance.com/api/v4",
  "token": "your-personal-access-token",
  "teamId": "your-team-id"
}
```

4. Build the server:
```bash
npm run build
```

5. Run the server:
```bash
npm start
```

## Tool Details

### Channel Tools

#### `mattermost_list_channels`
- List public channels in the workspace
- Optional inputs:
  - `limit` (number, default: 100, max: 200): Maximum number of channels to return
  - `page` (number, default: 0): Page number for pagination
- Returns: List of channels with their IDs and information

#### `mattermost_get_channel_history`
- Get recent messages from a channel
- Required inputs:
  - `channel_id` (string): The ID of the channel
- Optional inputs:
  - `limit` (number, default: 30): Number of messages to retrieve
  - `page` (number, default: 0): Page number for pagination
- Returns: List of messages with their content and metadata

### Message Tools

#### `mattermost_post_message`
- Post a new message to a Mattermost channel
- Required inputs:
  - `channel_id` (string): The ID of the channel to post to
  - `message` (string): The message text to post
- Returns: Message posting confirmation and ID

#### `mattermost_reply_to_thread`
- Reply to a specific message thread
- Required inputs:
  - `channel_id` (string): The channel containing the thread
  - `post_id` (string): ID of the parent message
  - `message` (string): The reply text
- Returns: Reply confirmation and ID

#### `mattermost_add_reaction`
- Add an emoji reaction to a message
- Required inputs:
  - `channel_id` (string): The channel containing the message
  - `post_id` (string): Message ID to react to
  - `emoji_name` (string): Emoji name without colons
- Returns: Reaction confirmation

#### `mattermost_get_thread_replies`
- Get all replies in a message thread
- Required inputs:
  - `channel_id` (string): The channel containing the thread
  - `post_id` (string): ID of the parent message
- Returns: List of replies with their content and metadata

### User Tools

#### `mattermost_get_users`
- Get list of workspace users with basic profile information
- Optional inputs:
  - `limit` (number, default: 100, max: 200): Maximum users to return
  - `page` (number, default: 0): Page number for pagination
- Returns: List of users with their basic profiles

#### `mattermost_get_user_profile`
- Get detailed profile information for a specific user
- Required inputs:
  - `user_id` (string): The user's ID
- Returns: Detailed user profile information

## Usage with Claude Desktop

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mattermost": {
      "command": "node",
      "args": [
        "/path/to/mattermost-mcp/build/index.js"
      ]
    }
  }
}
```

## Troubleshooting

If you encounter permission errors, verify that:
1. Your personal access token has the necessary permissions
2. The token is correctly copied to your configuration
3. The Mattermost URL and team ID are correct

## License

This MCP server is licensed under the MIT License.
