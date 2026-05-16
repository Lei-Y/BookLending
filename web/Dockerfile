# syntax=docker/dockerfile:1.7

# ---------- Build stage ----------
FROM node:24-alpine AS build
WORKDIR /app

# Copy lockfile + package.json first so `npm ci` is cached as long as
# the dependency tree does not change.
COPY web/package.json web/package-lock.json ./
RUN npm ci

# Copy the rest of the frontend source.
COPY web/ ./

# VITE_API_BASE_URL is consumed at build time by Vite. Override via
# `docker build --build-arg VITE_API_BASE_URL=...` or in compose.
ARG VITE_API_BASE_URL=http://localhost:5110
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# ---------- Runtime stage (static asset server) ----------
FROM nginx:alpine AS runtime

# Drop the default site config — we just serve /usr/share/nginx/html.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
