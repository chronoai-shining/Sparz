FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY index.html ./
COPY src ./src
COPY public ./public
RUN npm run build

FROM node:24-alpine
ENV NODE_ENV=production PORT=8080
WORKDIR /app
RUN addgroup -g 10001 sparz && adduser -D -u 10001 -G sparz sparz
COPY --from=build --chown=10001:10001 /app/dist ./dist
COPY --chown=10001:10001 server.mjs ./
USER 10001:10001
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD node -e "fetch('http://127.0.0.1:8080/health').then(response=>process.exit(response.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.mjs"]
