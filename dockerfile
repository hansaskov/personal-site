FROM mcr.microsoft.com/playwright:v1.62.1-noble
WORKDIR /app

RUN npm install -g pnpm@11.24.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

CMD pnpm preview --host
