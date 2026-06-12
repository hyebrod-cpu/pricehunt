FROM mcr.microsoft.com/playwright:v1.44.1-jammy
ENV NODE_ENV=production
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install
# Install browsers explicitly
RUN npx playwright install chromium --with-deps

# Copy the rest of the application code
COPY . ./

# Expose port 5000
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
