FROM node:20-alpine

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

RUN mkdir -p /app

WORKDIR /app

RUN apk add --no-cache chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY --from=ghcr.io/ufoscout/docker-compose-wait:latest /wait /wait

RUN npm install -g pnpm

COPY ./package.json ./
COPY ./package-lock.json ./
RUN pnpm install

EXPOSE 3000

COPY . /app
RUN pnpm run build

EXPOSE 3000 9229
CMD [ "pnpm", "run", "start"]
