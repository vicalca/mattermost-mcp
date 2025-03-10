#!/bin/bash

# Kill any existing server process
pkill -f "node build/index.js"

# Build the project
echo "Building the project..."
npm run build

# Start the server with the --run-monitoring flag
echo "Starting the server with --run-monitoring flag..."
node build/index.js --run-monitoring
