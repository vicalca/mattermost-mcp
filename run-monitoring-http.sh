#!/bin/bash

# This script triggers the monitoring process via the HTTP endpoint
# This is the most reliable way to trigger monitoring without restarting the server

echo "Triggering monitoring process via HTTP..."
curl -s http://localhost:3456/run-monitoring

echo -e "\nMonitoring process triggered. Check the server logs for results."
