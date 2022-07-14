FROM node:18-alpine

WORKDIR /app

COPY package.json yarn.lock .

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build
CMD yarn serve dist -l 0.0.0.0:3000

EXPOSE 3000
