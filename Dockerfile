# Stage 1: Build the client
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine
# Install native build tools for better-sqlite3
RUN apk add --no-cache python3 make g++
WORKDIR /app

# Copy server source and install production deps
COPY server/ ./server/
WORKDIR /app/server
RUN npm install --omit=dev
WORKDIR /app

# Copy built client from stage 1
COPY --from=client-build /app/client/dist ./client/dist

# Create data directory for SQLite
RUN mkdir -p /data

ENV NODE_ENV=production
EXPOSE ${PORT:-3001}

WORKDIR /app/server
CMD ["npx", "tsx", "src/app.ts"]
