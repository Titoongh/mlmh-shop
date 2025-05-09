# FROM --platform=linux/amd64 node:21-alpine AS base
FROM node:21-alpine AS base
WORKDIR /app
COPY . .

# Stripe needs a secret key to work during the build
ARG STRIPE_SECRET_KEY
ARG DATABASE_URL
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

ENV STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
ENV DATABASE_URL=${DATABASE_URL}

RUN npm install

# Development stage
FROM base AS development
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Production build stage
FROM base AS builder
WORKDIR /app
ENV NODE_ENV=production
# Generate Prisma client without --accelerate for build
RUN npx prisma generate
RUN npm run build

# Production runtime stage
FROM node:21-alpine AS production
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
RUN npm install --production
# Prisma generate with --accelerate will happen at runtime via entrypoint
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js /app/next.config.js
EXPOSE 3000
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
