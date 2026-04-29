FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json tsconfig.json ./
COPY ../../tsconfig.base.json ../../tsconfig.base.json 2>/dev/null || true
COPY src ./src
RUN npm install && npm run build

FROM node:20-alpine AS runner

# Install Java runtime (required by fcli) and wget
RUN apk add --no-cache openjdk17-jre-headless wget ca-certificates

# Install fcli
RUN wget -q https://github.com/fortify/fcli/releases/latest/download/fcli-linux.tgz \
    -O /tmp/fcli.tgz \
    && tar -xzf /tmp/fcli.tgz -C /usr/local/bin \
    && chmod +x /usr/local/bin/fcli \
    && rm /tmp/fcli.tgz

WORKDIR /app
ENV NODE_ENV=production
ENV FCLI_HOME=/home/node/.fcli

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

RUN addgroup -S fortify && adduser -S node -G fortify
RUN mkdir -p /home/node/.fcli && chown -R node:fortify /home/node/.fcli

USER node
EXPOSE 3003

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3003/health || exit 1

CMD ["node", "dist/main.js"]
