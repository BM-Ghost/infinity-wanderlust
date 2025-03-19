# Use the official Node.js 18 image as the base
FROM node:18

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    wget \
    curl \
    unzip \
    libglib2.0-0 \
    libnss3 \
    libgconf-2-4 \
    libfontconfig1 \
    libxtst6 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Google Chrome
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list && \
    apt-get update && \
    apt-get install -y google-chrome-stable

# Set the working directory
WORKDIR /app

# Copy project files into the container
COPY . .

# Install Node.js dependencies
RUN npm install

# Install Python dependencies for web scraping inside a virtual environment
RUN python3 -m venv /app/venv && \
    /app/venv/bin/pip install --no-cache-dir -r requirements.txt

# Set the virtual environment as the default for all subsequent commands
ENV PATH="/app/venv/bin:$PATH"

# Expose the desired port (optional, if your Node.js server listens on a specific port)
EXPOSE 5000

# Set the default command to start your Node.js server
CMD ["node", "server.js"]
