FROM node:20-alpine

RUN mkdir -p /app

WORKDIR /app

COPY ./package.json ./
COPY ./package-lock.json ./
RUN npm install

EXPOSE 3000

COPY . /app
RUN npm run build

EXPOSE 3000 9229
CMD [ "npm", "run", "api-dev"]
