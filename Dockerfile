FROM node:22-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --include=optional --no-audit --no-fund --fetch-retries=2 --fetch-timeout=120000 \
    && node -e "require('@next/swc-'+process.platform+'-'+process.arch+'-gnu'); require('sharp')"

FROM dependencies AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /app ./
USER node
EXPOSE 3000
CMD ["npm", "start"]
