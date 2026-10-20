FROM mcr.microsoft.com/playwright:v1.64.1-noble
WORKDIR /app

RUN npm install -g pnpm@12.14.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

CMD pnpm preview --host
