FROM node:lts-alpine

WORKDIR /app

COPY package*.json .
COPY tsoa.json .
COPY tsconfig.json .
COPY src ./src

RUN npm ci
RUN npm run build

CMD [ "npm", "start"]