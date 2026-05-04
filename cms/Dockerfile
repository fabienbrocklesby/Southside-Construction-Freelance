FROM node:22-bookworm-slim

WORKDIR /srv/app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build \
  && npm prune --omit=dev \
  && mkdir -p /srv/app/data /srv/app/public/uploads /srv/app/backups \
  && chown -R node:node /srv/app

USER node
EXPOSE 1337

CMD ["npm", "run", "start"]
