# syntax=docker/dockerfile:1

FROM oven/bun:1-alpine AS deps
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL

RUN bun run build

FROM nginx:1.27-bookworm AS nginx

FROM debian:bookworm-slim AS nginx-bundle
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=nginx /usr/sbin/nginx /bundle/usr/sbin/nginx
COPY --from=nginx /etc/nginx/mime.types /bundle/etc/nginx/mime.types
COPY nginx/nginx.conf /bundle/etc/nginx/nginx.conf
COPY nginx/default.conf /bundle/etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /bundle/usr/share/nginx/html

RUN set -eux; \
    mkdir -p /bundle/var/cache/nginx/client_temp \
        /bundle/var/cache/nginx/proxy_temp \
        /bundle/var/cache/nginx/fastcgi_temp \
        /bundle/var/cache/nginx/uwsgi_temp \
        /bundle/var/cache/nginx/scgi_temp \
        /bundle/var/log/nginx \
        /bundle/var/run; \
    ldd /bundle/usr/sbin/nginx | awk '/=>/ { print $3 }' | while read -r lib; do \
        if [ -f "$lib" ]; then \
            dest="/bundle${lib}"; \
            mkdir -p "$(dirname "$dest")"; \
            cp "$lib" "$dest"; \
        fi; \
    done; \
    for loader in /lib/*/ld-linux-*.so.*; do \
        dest="/bundle${loader}"; \
        mkdir -p "$(dirname "$dest")"; \
        cp "$loader" "$dest"; \
    done; \
    chown -R 65532:65532 \
        /bundle/var/cache/nginx \
        /bundle/var/log/nginx \
        /bundle/var/run \
        /bundle/usr/share/nginx/html

FROM gcr.io/distroless/base-debian12:nonroot
ENV BACKEND_URL=http://backend:8080

COPY --from=nginx-bundle --chown=65532:65532 /bundle /

EXPOSE 8080

ENTRYPOINT ["/usr/sbin/nginx"]
CMD ["-g", "daemon off;"]
