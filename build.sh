#!/bin/bash
set -e

echo "Installing root dependencies..."
npm install --legacy-peer-deps

echo "Building client..."
cd client
npm install --legacy-peer-deps
npm run build

echo "Build completed successfully!"
