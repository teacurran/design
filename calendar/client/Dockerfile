FROM node:20-alpine

RUN mkdir -p /app

WORKDIR /app

COPY ./package.json ./
COPY ./package-lock.json ./
RUN npm install

EXPOSE 3000
CMD [ "npm", "start"]
