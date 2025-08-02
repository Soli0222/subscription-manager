# Helm Chart for Subscription Manager

このディレクトリには、サブスクリプション管理アプリケーションのKubernetesデプロイ用Helmチャートが含まれています。

## 構成

このHelmチャートは以下のコンポーネントをデプロイします：

- **Application Deployment**: Next.jsアプリケーション
- **PostgreSQL StatefulSet**: データベース（永続化対応）
- **Services**: アプリケーションとデータベース用
- **ConfigMap**: データベース初期化スクリプト

## インストール

### 基本インストール

```bash
# Helmチャートのインストール
helm install subscription-manager ./helm/subscription-manager

# カスタム値でインストール
helm install subscription-manager ./helm/subscription-manager -f values-production.yaml
```

### アップグレード

```bash
helm upgrade subscription-manager ./helm/subscription-manager
```

### アンインストール

```bash
helm uninstall subscription-manager
```

## 設定

### 基本設定（values.yaml）

```yaml
# アプリケーションレプリカ数
replicaCount: 1

# コンテナイメージ設定
image:
  repository: subscription-manager
  tag: "latest"
  pullPolicy: IfNotPresent

# PostgreSQL設定
postgresql:
  enabled: true
  auth:
    postgresPassword: "secure_password_123"
    database: "subscription_manager"
  primary:
    persistence:
      enabled: true
      size: 8Gi

# 環境変数
env:
  POSTGRES_USER: "postgres"
  POSTGRES_PASSWORD: "secure_password_123"
  POSTGRES_DB: "subscription_manager"
  POSTGRES_HOST: "subscription-manager-postgresql"
  POSTGRES_PORT: "5432"
  POSTGRES_SSL: "disable"
  EXCHANGE_RATE_API_URL: "https://api.exchangerate-api.com/v4/latest/USD"
```

### カスタマイズ例

#### 本番環境用設定

```yaml
# values-production.yaml
replicaCount: 3

resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 500m
    memory: 512Mi

postgresql:
  primary:
    persistence:
      size: 50Gi

env:
  POSTGRES_SSL: "require"
```

#### Ingress設定

外部からアクセス可能にする場合：

```yaml
# values-ingress.yaml
ingress:
  enabled: true
  className: nginx  # または使用するIngress Controllerに応じて
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
  hosts:
    - host: subscription-manager.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: subscription-manager-tls
      hosts:
        - subscription-manager.example.com
```

#### 外部PostgreSQL使用

```yaml
# values-external-db.yaml
postgresql:
  enabled: false

env:
  POSTGRES_HOST: "external-postgres.example.com"
  POSTGRES_PORT: "5432"
  POSTGRES_SSL: "require"

# 外部Secretを使用
credentials:
  external: true
  externalName: "postgres-credentials"
```

#### 外部Secretリソースの使用

既存のSecretリソースを使用する場合：

```yaml
# values-external-secret.yaml
credentials:
  external: true
  externalName: "my-postgres-secret"
```

外部Secretは以下のキーを含む必要があります：
- `postgres-user`: PostgreSQLユーザー名
- `postgres-password`: PostgreSQLパスワード  
- `postgres-db`: データベース名

外部Secretの作成例：
```bash
kubectl create secret generic my-postgres-secret \
  --from-literal=postgres-user=myuser \
  --from-literal=postgres-password=mypassword \
  --from-literal=postgres-db=mydatabase
```

## デプロイ確認

```bash
# Pod状態確認
kubectl get pods -l app.kubernetes.io/name=subscription-manager

# サービス確認
kubectl get services -l app.kubernetes.io/name=subscription-manager

# ログ確認
kubectl logs -l app.kubernetes.io/name=subscription-manager -c subscription-manager

# データベースログ確認
kubectl logs -l app.kubernetes.io/component=database
```

## トラブルシューティング

### よくある問題

1. **PostgreSQLが起動しない**
   ```bash
   # PVCの状態確認
   kubectl get pvc
   
   # PostgreSQLログ確認
   kubectl logs -l app.kubernetes.io/component=database
   ```

2. **アプリケーションがデータベースに接続できない**
   ```bash
   # 環境変数確認
   kubectl describe pod -l app.kubernetes.io/name=subscription-manager
   
   # ネットワーク接続確認
   kubectl exec -it <app-pod> -- nslookup subscription-manager-postgresql
   ```

3. **イメージがpullできない**
   ```bash
   # イメージ設定確認
   helm get values subscription-manager
   
   # イメージビルド
   docker build -t subscription-manager:latest .
   ```

## 監視とメンテナンス

### ヘルスチェック

- **Liveness Probe**: アプリケーションの生存確認（30秒後から10秒間隔）
- **Readiness Probe**: トラフィック受け入れ準備確認（5秒後から5秒間隔）
- **Startup Probe**: 初期起動確認（10秒後から10秒間隔、最大60秒）

### データバックアップ

```bash
# PostgreSQLデータのバックアップ
kubectl exec -it <postgresql-pod> -- pg_dump -U postgres subscription_manager > backup.sql
```

### ローリングアップデート

```bash
# 新しいイメージでアップデート
helm upgrade subscription-manager ./helm/subscription-manager --set image.tag=v1.1.0
```
