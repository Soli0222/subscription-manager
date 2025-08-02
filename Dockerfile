# Node.js の公式イメージを使用
FROM node:22.17.1-alpine AS base

# Corpackを有効化してpackageManagerフィールドを使用
RUN corepack enable

# 依存関係の準備
FROM base AS deps
WORKDIR /app

# package.json と pnpm-lock.yaml をコピー
COPY package.json pnpm-lock.yaml* ./

# 依存関係をインストール
RUN pnpm install --frozen-lockfile

# ビルダーステージ
FROM base AS builder
WORKDIR /app

# 依存関係をコピー
COPY --from=deps /app/node_modules ./node_modules

# ソースコードをコピー
COPY . .

# アプリケーションをビルド
RUN pnpm build

# ランナーステージ
FROM node:22.17.1-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# システムユーザーを作成
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# standloneビルドの成果物をコピー
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# ユーザーを変更
USER nextjs

# ポートを公開
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# アプリケーションを起動
CMD ["node", "server.js"]
