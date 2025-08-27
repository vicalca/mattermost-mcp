#!/bin/sh

# The script will read the following environment variables and update the JSON configuration accordingly:
# - MATTERMOST_URL: The URL for the Mattermost API.
# - MATTERMOST_TOKEN: The authentication token.
# - MATTERMOST_TEAM_ID: The ID of the team.
# - MONITORING_ENABLED: Set to "true" or "false" to enable/disable monitoring.
# - MONITORING_SCHEDULE: The cron schedule for monitoring.
# - MONITORING_CHANNELS: A JSON array string, e.g., '["new-channel-1", "general"]'
# - MONITORING_TOPICS: A JSON array string, e.g., '["movies", "sports"]'
# - MONITORING_MESSAGE_LIMIT: The message limit as a number.

CONFIG_FILE="config.json"

# Check if the config file exists
if [ ! -f "$CONFIG_FILE" ]; then
  echo "Error: File not found at '$CONFIG_FILE'"
  exit 1
fi

echo "Updating configuration in '$CONFIG_FILE'..."

if [ -n "$MATTERMOST_URL" ]; then
  yq -i '.mattermostUrl = strenv(MATTERMOST_URL)' "$CONFIG_FILE"
  echo "Updated mattermostUrl."
fi

if [ -n "$MATTERMOST_TOKEN" ]; then
  yq -i '.token = strenv(MATTERMOST_TOKEN)' "$CONFIG_FILE"
  echo "Updated token."
fi

if [ -n "$MATTERMOST_TEAM_ID" ]; then
  yq -i '.teamId = strenv(MATTERMOST_TEAM_ID)' "$CONFIG_FILE"
  echo "Updated teamId."
fi

# Update nested monitoring values
if [ -n "$MONITORING_ENABLED" ]; then
  # Convert the string "true" or "false" to a boolean value in JSON
  yq -i '.monitoring.enabled = (strenv(MONITORING_ENABLED) | test("true"))' "$CONFIG_FILE"
  echo "Updated monitoring.enabled."
fi

if [ -n "$MONITORING_SCHEDULE" ]; then
  yq -i '.monitoring.schedule = strenv(MONITORING_SCHEDULE)' "$CONFIG_FILE"
  echo "Updated monitoring.schedule."
fi

if [ -n "$MONITORING_CHANNELS" ]; then
  # The env var should be a valid JSON array string, e.g., '["chan1", "chan2"]'
  yq -i '.monitoring.channels = (strenv(MONITORING_CHANNELS) | fromjson)' "$CONFIG_FILE"
  echo "Updated monitoring.channels."
fi

if [ -n "$MONITORING_TOPICS" ]; then
  # The env var should be a valid JSON array string, e.g., '["topic1", "topic2"]'
  yq -i '.monitoring.topics = (strenv(MONITORING_TOPICS) | fromjson)' "$CONFIG_FILE"
  echo "Updated monitoring.topics."
fi

if [ -n "$MONITORING_MESSAGE_LIMIT" ]; then
  # Convert the string from the env var to a number
  yq -i '.monitoring.messageLimit = (strenv(MONITORING_MESSAGE_LIMIT) | tonumber)' "$CONFIG_FILE"
  echo "Updated monitoring.messageLimit."
fi

echo "Configuration update complete."

echo "Running server with updated configuration..."

supergateway --stdio "npm run start" --port 8001