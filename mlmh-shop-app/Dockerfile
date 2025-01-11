FROM node:21-alpine AS base
WORKDIR /app
COPY . .
RUN npm install
# COPY package*.json ./
# COPY ./app .
# COPY ./lib .
# COPY ./prisma .
# COPY middleware.ts .
# COPY next-env.d.ts .
# COPY next.config.js .
# COPY package.json .
# COPY postcss.config.js .
# COPY tailwind.config.ts .
# COPY tsconfig.json .
# COPY .eslintrc.json .

# Development stage
FROM base AS development
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Production build stage
FROM base AS builder
WORKDIR /app
ARG STRIPE_SECRET_KEY=dummy_key_for_build
ENV STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
ENV NODE_ENV=production
RUN npx prisma generate
RUN npm run build

# Production runtime stage
FROM node:21-alpine AS production
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
RUN npm install --production
RUN npx prisma generate
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
EXPOSE 3000
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
