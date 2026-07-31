#!/bin/bash
set -e

# Install frontend dependencies (including devDeps for vite build)
cd frontend
npm install --include=dev

# Build frontend
npx vite build

# Install backend dependencies
cd ../backend
npm install
