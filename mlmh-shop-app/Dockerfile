# Use the official Node.js 16 image as a parent image
FROM node:21-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your app's source code
COPY . .

# Expose the port Next.js runs on
EXPOSE 3000

# Run the app in development mode
CMD ["npm", "run", "dev"]
