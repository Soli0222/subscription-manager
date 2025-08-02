/**
 * データベース接続設定のユーティリティ
 */

export interface DatabaseConfig {
  user: string
  password: string
  host: string
  port: string
  database: string
  ssl: string
}

/**
 * 環境変数からデータベース設定を取得
 */
export function getDatabaseConfig(): DatabaseConfig {
  const config = {
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || '5432',
    database: process.env.POSTGRES_DB || 'subscription_manager',
    ssl: process.env.POSTGRES_SSL || 'prefer'
  }

  // 必須環境変数のチェック
  if (!process.env.POSTGRES_PASSWORD) {
    console.warn('⚠️  POSTGRES_PASSWORD is not set, using default password')
  }

  return config
}

/**
 * DATABASE_URLを動的に構築
 */
export function buildDatabaseUrl(): string {
  const config = getDatabaseConfig()
  
  return `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}?sslmode=${config.ssl}`
}

/**
 * 開発環境用のデータベース設定表示
 */
export function logDatabaseConfig(): void {
  if (process.env.NODE_ENV === 'development') {
    const config = getDatabaseConfig()
    console.log('📊 Database Configuration:')
    console.log(`   Host: ${config.host}:${config.port}`)
    console.log(`   Database: ${config.database}`)
    console.log(`   User: ${config.user}`)
    console.log(`   SSL Mode: ${config.ssl}`)
  }
}
