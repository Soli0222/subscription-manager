# サブスクリプション管理アプリケーション

シングルユーザー向けのサブスクリプション管理Webアプリケーションです。

## 概要

このアプリケーションは、個人のサブスクリプションサービスを一元管理し、月あたりの支払い総額を視覚的に把握できるWebアプリケーションです。

## 主要機能

- **サブスクリプションの登録・管理**
  - サービス名、金額、通貨（円/ドル）、開始日、終了日、支払いサイクル（月次/年次）の登録
  - 登録済みサブスクリプションの編集・削除
- **支払い額の可視化**
  - 月ごとの支払い総額を棒グラフで表示
  - ドル建てサブスクリプションの自動円換算（過去30日間の平均為替レート使用）
- **ダッシュボード**
  - 現在有効なサブスクリプション一覧
  - 当月の支払い総額表示
  - アクティブサブスクリプション統計
- **レスポンシブデザイン**
  - ダークモード/ライトモード対応
  - モバイルフレンドリーなUI

## 技術スタック

- **フロントエンド**: Next.js 15.4.5, React 19.1.0, TypeScript
- **スタイリング**: Tailwind CSS 4, shadcn/ui, Lucide React
- **バックエンド**: Next.js API Routes
- **データベース**: PostgreSQL 17.5, Raw SQL (pg ライブラリ)
- **バリデーション**: Zod
- **チャート**: Recharts
- **コンテナ**: Docker, Docker Compose
- **デプロイ**: Kubernetes, Helm
- **パッケージマネージャー**: pnpm 10.14.0

## 開発環境のセットアップ

### 前提条件

- Node.js 22.17.1
- pnpm 10.14.0
- Docker & Docker Compose

### インストール

1. 依存関係のインストール:
```bash
pnpm install
```

2. 環境変数の設定:
`.env` ファイルを作成し、必要な環境変数を設定してください（後述の環境変数セクションを参照）

3. データベースの起動（Docker使用）:
```bash
docker-compose up -d db
```

4. 開発サーバーの起動:
```bash
pnpm dev
```

5. ブラウザで http://localhost:3000 を開く

### 環境変数

`.env` ファイルを作成し、以下の環境変数を設定してください：

```env
# PostgreSQL設定
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="your_secure_password"
POSTGRES_DB="subscription_manager"
POSTGRES_HOST="localhost"
POSTGRES_PORT="5432"
POSTGRES_SSL="prefer"

# 為替レートAPI設定
EXCHANGE_RATE_API_URL="https://api.exchangerate-api.com/v4/latest/USD"
```

> **注意**: 本番環境では強力なパスワードを設定してください。Docker環境では `POSTGRES_HOST` を `db` に変更してください。

## Dockerでの実行

### 開発環境
```bash
# アプリケーションとデータベースを起動
docker-compose up -d

# ログの確認
docker-compose logs -f
```

### 本番環境
```bash
# 本番用イメージのビルドと起動
docker-compose -f docker-compose.yml up -d --build

# データベースのヘルスチェック確認
docker-compose ps
```

## アーキテクチャ

### データベース設計
- **subscriptions**: サブスクリプション情報（サービス名、金額、通貨、支払いサイクルなど）
- **exchange_rates**: 為替レート履歴（USD/JPY）

### API設計
- 標準的なRESTful API設計
- Zodによるリクエストバリデーション
- エラーハンドリングとレスポンス統一

## デプロイメント

### Kubernetes + Helm

プロジェクトにはHelmチャートが含まれており、Kubernetesへの簡単なデプロイが可能です：

```bash
# Helmチャートのインストール
helm install subscription-manager ./helm/subscription-manager

# カスタム値を使用したインストール
helm install subscription-manager ./helm/subscription-manager -f values-prod.yaml

# アプリケーションのアップグレード
helm upgrade subscription-manager ./helm/subscription-manager

# 状態確認
kubectl get pods,services,ingress
```

### 設定のカスタマイズ

`helm/subscription-manager/values.yaml` ファイルを編集してデプロイメント設定をカスタマイズできます：

- **PostgreSQL設定**: 内蔵PostgreSQLまたは外部データベースの選択
- **リソース制限**: CPU/メモリ制限の設定
- **Ingress設定**: ドメイン名やTLS証明書の設定
- **環境変数**: アプリケーション固有の設定

## トラブルシューティング

### よくある問題

1. **データベース接続エラー**
   ```bash
   # PostgreSQLサービスの状態確認
   docker-compose ps db
   
   # ログの確認
   docker-compose logs db
   ```

2. **為替レートAPI エラー**
   - `EXCHANGE_RATE_API_URL` の設定を確認
   - API制限に達していないかチェック

3. **ビルドエラー**
   ```bash
   # node_modulesをクリア
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

### ログの確認

```bash
# 開発環境
pnpm dev

# Docker環境
docker-compose logs -f app

# Kubernetes環境
kubectl logs -l app=subscription-manager -f
```

## 貢献

プロジェクトへの貢献は歓迎します。Issue の報告やプルリクエストをお送りください。

### 開発ワークフロー

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/new-feature`)
3. 変更をコミット (`git commit -am 'Add new feature'`)
4. ブランチにプッシュ (`git push origin feature/new-feature`)
5. プルリクエストを作成

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルをご覧ください。

### エンドポイント

#### サブスクリプション管理
- `POST /api/subscriptions` - 新規サブスクリプション登録
- `GET /api/subscriptions` - 全サブスクリプション取得
- `GET /api/subscriptions/{id}` - 特定サブスクリプション取得
- `PUT /api/subscriptions/{id}` - サブスクリプション更新
- `DELETE /api/subscriptions/{id}` - サブスクリプション削除

#### レポート
- `GET /api/reports/monthly-summary` - 月次サマリー取得
  - クエリパラメータ: `startMonth`, `endMonth`, `months`

### リクエスト/レスポンス例

#### サブスクリプション作成
```json
POST /api/subscriptions
{
  "serviceName": "Netflix",
  "amount": 1980,
  "currency": "JPY",
  "startDate": "2025-01-01",
  "endDate": null,
  "paymentCycle": "MONTHLY"
}
```

#### 月次サマリー
```json
GET /api/reports/monthly-summary?months=12
[
  {
    "month": "2025-01",
    "totalAmount": 15800,
    "subscriptions": [...]
  }
]
```

## 為替レート

- ドル建てサブスクリプションは登録時点から過去30日間の平均為替レートで円に換算されます
- 為替レートは外部API（exchangerate-api.com）から取得し、データベースに保存されます
- 為替レート情報は自動的に更新され、過去のレート履歴も保持されます

## 開発用スクリプト

```bash
# 開発サーバー起動（Turbopack使用）
pnpm dev

# プロダクションビルド
pnpm build

# プロダクションサーバー起動
pnpm start

# 型チェック
pnpm build  # TypeScriptコンパイル時に型チェック実行

# Linting
pnpm lint

# テスト実行
pnpm test

# テスト（監視モード）
pnpm test:watch

# テストカバレッジ
pnpm test:coverage
```

## テスト

このプロジェクトではJestを使用してテストを実装しています。

### テスト構成

- **単体テスト**: ユーティリティ関数とビジネスロジックの単体テスト
- **バリデーションテスト**: Zodスキーマの検証テスト
- **型テスト**: TypeScript型定義の検証テスト

### テストファイル構成

```
src/__tests__/
├── utils/              # ユーティリティ関数のテスト
│   ├── convertToJpy.test.ts    # 為替変換関数のテスト
│   └── className.test.ts       # CSSクラス結合関数のテスト
├── validation/         # バリデーション関連のテスト
│   └── subscription-schema.test.ts # サブスクリプションスキーマのテスト
└── types/              # 型定義のテスト
    └── index.test.ts           # TypeScript型の検証テスト
```

### テスト実行方法

```bash
# 全テスト実行
pnpm test

# 特定のテストファイル実行
pnpm test src/__tests__/utils/convertToJpy.test.ts

# 監視モードでテスト実行（ファイル変更時に自動実行）
pnpm test:watch

# カバレッジレポート付きテスト実行
pnpm test:coverage
```

### テストの特徴

1. **為替変換テスト**: USD→JPY変換ロジックの検証
2. **バリデーションテスト**: ユーザー入力データの検証ルールテスト
3. **型安全性テスト**: TypeScript型定義の妥当性確認
4. **ユーティリティテスト**: 汎用関数の動作確認

テストは継続的に拡張され、アプリケーションの品質を保証しています。

## プロジェクト構成

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── subscriptions/ # サブスクリプション関連API
│   │   └── reports/       # レポート関連API
│   ├── globals.css        # グローバルスタイル
│   ├── layout.tsx         # ルートレイアウト
│   └── page.tsx          # ホームページ
├── components/            # Reactコンポーネント
│   ├── ui/               # shadcn/ui コンポーネント
│   ├── Dashboard.tsx     # メインダッシュボード
│   ├── SubscriptionForm.tsx
│   ├── SubscriptionList.tsx
│   └── MonthlyChart.tsx
├── lib/                  # ユーティリティライブラリ
│   ├── db.ts            # データベース接続
│   ├── repository.ts    # データベースリポジトリ
│   ├── exchange-rate.ts # 為替レート処理
│   └── utils.ts         # 汎用ユーティリティ
└── types/               # TypeScript型定義
    └── index.ts
```

## 開発者向け

### スキーマ同期管理

このプロジェクトでは、データベーススキーマが2つの場所で管理されています：
- `sql/schema.sql` - メインのスキーマファイル
- `helm/subscription-manager/templates/configmap.yaml` - Kubernetes用のConfigMap

これらが同期されていることを確認するため、以下のツールが提供されています：

#### スキーマ同期チェック
```bash
# スキーマが同期されているかチェック
./scripts/check-schema-sync.sh
```

#### スキーマの自動同期
```bash
# schema.sqlの内容をConfigMapに同期
./scripts/sync-schema.sh
```

#### GitHub Actions
`schema.sql` または `configmap.yaml` が変更されると、自動的にスキーマの同期チェックが実行されます（`.github/workflows/schema-sync-check.yaml`）。

### 開発ワークフロー

1. `sql/schema.sql` でスキーマを変更
2. `./scripts/sync-schema.sh` でConfigMapを更新
3. `./scripts/check-schema-sync.sh` で同期を確認
4. コミット前に必ずテストを実行

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
