# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
# This allows us to install dependencies
COPY package*.json ./

# Install application dependencies, including dev dependencies for TypeScript compilation
RUN npm install

# Copy the entire TypeScript source code to the working directory
COPY . .

# Compile TypeScript to JavaScript
# Assuming your tsconfig.json is configured to output to a 'build' directory
# RUN npm run build # Or `tsc` if you run tsc directly without a script
RUN tsc

# Expose the port your Express app listens on
EXPOSE 3000

# Define the command to run your compiled JavaScript application
CMD [ "node", "./build/app.js" ]