FROM node:latest

# Install client dependencies
WORKDIR /client
COPY ./client/package.json .
RUN npm install --no-audit --no-package-lock

# Install server dependencies
WORKDIR /server
COPY ./server/package.json .
RUN npm install --no-audit --no-package-lock

# Build client
WORKDIR /client
COPY ./client/src ./src/
COPY ./client/public ./public/
COPY ./client/tsconfig.json .
RUN npm run build

# Build server
WORKDIR /server
COPY ./server/src ./src/
COPY ./server/tsconfig.json .
RUN npm run build

VOLUME [ "/server/db" ]

# Run server
CMD cd /server && npm run run