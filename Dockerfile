# Hugging Face Docker Space and the Render web service.
# Hugging Face listens on 7860 (README.md sets sdk: docker and app_port: 7860).
# Render injects PORT. docker-entrypoint.sh keeps 7860 only when PORT is unset.

FROM node:22-bookworm-slim AS build

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NEXT_TELEMETRY_DISABLED=1 \
  PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
  PNPM_HOME=/pnpm \
  PATH=/pnpm:$PATH

RUN corepack enable && corepack prepare pnpm@11.0.8 --activate

WORKDIR /app
COPY . .

# Next inlines NEXT_PUBLIC_ values at build time. Render passes service env vars as build args.
ARG NEXT_PUBLIC_APP_URL=https://lyzr-ai-project.onrender.com
ARG NEXT_PUBLIC_SUPABASE_URL=
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
  NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

RUN pnpm install --frozen-lockfile
RUN pnpm --filter architect-2 build

FROM node:22-bookworm-slim AS runner

# The Node image already owns uid 1000 as `node`. Hugging Face requires the name `user`.
RUN usermod -l user -d /home/user -m node \
 && groupmod -n user node

WORKDIR /app
ENV NODE_ENV=production \
  NEXT_TELEMETRY_DISABLED=1 \
  HOSTNAME=0.0.0.0 \
  HOME=/home/user \
  ARCHITECT_AUTH=off

COPY --from=build --chown=user:user ["/app/phase 5 - ship/.next/standalone", "./"]
COPY --from=build --chown=user:user ["/app/phase 5 - ship/.next/static", "./phase 5 - ship/.next/static"]
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod 755 /usr/local/bin/docker-entrypoint.sh \
  && mkdir -p "/app/phase 5 - ship/.data" \
  && chown -R user:user "/app/phase 5 - ship"

USER user
EXPOSE 7860
WORKDIR "/app/phase 5 - ship"
CMD ["docker-entrypoint.sh"]
