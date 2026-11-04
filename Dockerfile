FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && curl -fsSL "https://storage.googleapis.com/antigravity-public/plugin/cli/999922155/linux_x86_64/gdrive" -o /usr/local/bin/gdrive \
  && chmod +x /usr/local/bin/gdrive

WORKDIR /app

COPY package.json ./
COPY server.js ./
COPY lib ./lib
COPY scripts ./scripts
COPY public ./public
COPY config.example.json ./

ENV PORT=3456
EXPOSE 3456

CMD ["node", "server.js"]
