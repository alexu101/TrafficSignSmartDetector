# Use an official Node.js image as base
FROM node:18-slim

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (for caching dependencies)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the port Cloud Run will use
EXPOSE 8080

# Start the Node.js application
CMD ["node", "src/app.js"]
