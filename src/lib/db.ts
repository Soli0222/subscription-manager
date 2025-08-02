import { Pool } from 'pg'
import { buildDatabaseUrl, logDatabaseConfig } from './database-config'

// データベース設定をログ出力（開発環境のみ）
logDatabaseConfig()

const pool = new Pool({
  connectionString: buildDatabaseUrl(),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

export default pool
