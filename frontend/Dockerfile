FROM node:18.20.4-alpine as builder

WORKDIR /app

ARG GL_TOKEN
ARG VITE_APP_VERSION
ARG SENTRY_AUTH_TOKEN_WEB

# install pnpm
RUN npm install -g pnpm

COPY . .

# install dependencies
RUN pnpm install

# build app
RUN npm run build:js

FROM nginx:1.21-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf
