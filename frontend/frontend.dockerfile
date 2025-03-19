# Base Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy app source code
COPY . .

# Expose port and start the app
EXPOSE 3000
CMD ["npm", "start"]
