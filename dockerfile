FROM node:lts AS runtime
WORKDIR /app

RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install

COPY . .

RUN pnpm build

ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321

CMD pnpm preview --host