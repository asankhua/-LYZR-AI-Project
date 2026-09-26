# Hugging Face Docker Space. https://huggingface.co/docs/hub/spaces-sdks-docker
# The Space listens on 7860. README.md sets sdk: docker and app_port: 7860.

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
RUN pnpm install --frozen-lockfile
RUN pnpm --filter architect-2 build

FROM node:22-bookworm-slim AS runner

RUN useradd -m -u 1000 user

WORKDIR /app
ENV NODE_ENV=production \
  NEXT_TELEMETRY_DISABLED=1 \
  PORT=7860 \
  HOSTNAME=0.0.0.0 \
  HOME=/home/user

COPY --from=build --chown=user:user ["/app/phase 5 - ship/.next/standalone", "./"]
COPY --from=build --chown=user:user ["/app/phase 5 - ship/.next/static", "./phase 5 - ship/.next/static"]

RUN mkdir -p "/app/phase 5 - ship/.data" && chown -R user:user "/app/phase 5 - ship"

USER user
EXPOSE 7860
WORKDIR "/app/phase 5 - ship"
CMD ["node", "server.js"]
