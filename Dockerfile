FROM node:22-alpine3.23 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine3.23
RUN apk upgrade --no-cache
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
ENV NODE_ENV=production
EXPOSE 3100
CMD ["node", "dist/src/main.js"]
