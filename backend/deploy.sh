#!/bin/bash

# Start Docker containers
docker-compose up -d

# Wait for the containers to be fully up and running
echo "Waiting for Docker containers to start..."
sleep 10

# Start the Node.js server
echo "Starting Node.js server..."
npm start
