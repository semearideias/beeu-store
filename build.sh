#!/bin/bash
set -e

echo "Current directory: $(pwd)"
echo "Files in current directory:"
ls -la

echo "Installing client dependencies..."
cd client
npm install --legacy-peer-deps
npm run build

echo "Build completed successfully!"
