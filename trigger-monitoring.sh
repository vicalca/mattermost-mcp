#!/bin/bash

# This script starts a new server instance with the --run-monitoring flag
# It will run the monitoring process immediately and then exit

echo "Starting a new server instance with --run-monitoring flag..."
node build/index.js --run-monitoring --exit-after-monitoring
