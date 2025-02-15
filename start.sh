#!/bin/bash

# Install Node.js and frontend/backend dependencies
npm install && \
npm install --prefix frontend && \
npm install --prefix backend && \
npm run build --prefix frontend

# Install Python dependencies
pip install -r backend/requirements.txt

# Install Google Chrome
apt-get update && apt-get install -y wget gnupg
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
apt-get install -y ./google-chrome-stable_current_amd64.deb
