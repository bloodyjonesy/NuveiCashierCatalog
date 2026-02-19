# Node 20 + Playwright with system deps (libglib etc.) so screenshot API works
FROM node:20-bookworm AS base

WORKDIR /app

# Install Playwright Chromium and all system dependencies (fixes libglib-2.0.so.0 missing)
RUN npx -y playwright@1.40.0 install chromium --with-deps

# App dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Build
COPY . .
RUN npm run build

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "start"]
