# Node 20 + Playwright with system deps (libglib etc.) so screenshot API works on Railway
FROM node:20-bookworm AS base

WORKDIR /app

# App dependencies first (so we use the same Playwright version as at runtime)
COPY package.json package-lock.json* ./
RUN npm ci

# Install Chromium + system deps using the project's Playwright (version must match node_modules)
RUN npx playwright install chromium --with-deps

# Build
COPY . .
RUN npm run build

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "start"]
