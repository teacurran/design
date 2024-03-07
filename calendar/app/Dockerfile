FROM node:20-alpine

RUN mkdir -p /app

WORKDIR /app

RUN apk add --no-cache chromium

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY ./package.json ./
COPY ./package-lock.json ./
RUN npm install

EXPOSE 3000

COPY . /app
RUN npm run build

EXPOSE 3000 9229
CMD [ "npm", "run", "serve"]
