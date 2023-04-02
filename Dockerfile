FROM node:lts-alpine as builder
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build

FROM node:lts-alpine as runner
WORKDIR /app

COPY package*.json .
COPY --from=builder /app/dist /app/dist

RUN npm ci --omit=dev

CMD [ "npm", "start"]