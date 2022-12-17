FROM node:14.17.1
WORKDIR /app

# Establish
LABEL org.opencontainers.image.source https://github.com/jareware/lightening

# Install app dependencies
COPY package*.json .
ENV NO_UPDATE_NOTIFIER true
RUN npm install --production

# Copy our own source files
COPY build .

# Set default startup command
CMD node server.js
