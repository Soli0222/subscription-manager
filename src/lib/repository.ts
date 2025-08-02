import pool from './db'
import { Subscription, ExchangeRate } from '@/types'

type SubscriptionRow = {
  id: string
  service_name: string
  amount: string
  currency: string
  start_date: Date | null
  end_date: Date | null
  payment_cycle: string
  exchange_rate: string | null
  created_at: Date
  updated_at: Date
}

type ExchangeRateRow = {
  id: string
  date: string
  usd_to_jpy: string
  created_at: string
}

export class SubscriptionRepository {
  async create(subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subscription> {
    const query = `
      INSERT INTO subscriptions (service_name, amount, currency, start_date, end_date, payment_cycle, exchange_rate)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, service_name, amount, currency, start_date, end_date, payment_cycle, exchange_rate, created_at, updated_at
    `
    const values = [
      subscription.serviceName,
      subscription.amount,
      subscription.currency,
      subscription.startDate,
      subscription.endDate || null,
      subscription.paymentCycle,
      subscription.exchangeRate || null
    ]
    
    const result = await pool.query(query, values)
    return this.mapRowToSubscription(result.rows[0])
  }

  async findAll(): Promise<Subscription[]> {
    const query = `
      SELECT id, service_name, amount, currency, start_date, end_date, payment_cycle, exchange_rate, created_at, updated_at
      FROM subscriptions
      ORDER BY created_at DESC
    `
    const result = await pool.query(query)
    return result.rows.map(this.mapRowToSubscription)
  }

  async findById(id: string): Promise<Subscription | null> {
    const query = `
      SELECT id, service_name, amount, currency, start_date, end_date, payment_cycle, exchange_rate, created_at, updated_at
      FROM subscriptions
      WHERE id = $1
    `
    const result = await pool.query(query, [id])
    return result.rows[0] ? this.mapRowToSubscription(result.rows[0]) : null
  }

  async update(id: string, subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subscription> {
    const query = `
      UPDATE subscriptions
      SET service_name = $1, amount = $2, currency = $3, start_date = $4, end_date = $5, payment_cycle = $6, exchange_rate = $7
      WHERE id = $8
      RETURNING id, service_name, amount, currency, start_date, end_date, payment_cycle, exchange_rate, created_at, updated_at
    `
    const values = [
      subscription.serviceName,
      subscription.amount,
      subscription.currency,
      subscription.startDate,
      subscription.endDate || null,
      subscription.paymentCycle,
      subscription.exchangeRate || null,
      id
    ]
    
    const result = await pool.query(query, values)
    return this.mapRowToSubscription(result.rows[0])
  }

  async delete(id: string): Promise<void> {
    const query = 'DELETE FROM subscriptions WHERE id = $1'
    await pool.query(query, [id])
  }

  private mapRowToSubscription(row: SubscriptionRow): Subscription {
    return {
      id: row.id,
      serviceName: row.service_name,
      amount: parseFloat(row.amount),
      currency: row.currency as 'JPY' | 'USD',
      startDate: row.start_date ? new Date(row.start_date) : new Date(),
      endDate: row.end_date ? new Date(row.end_date) : undefined,
      paymentCycle: row.payment_cycle as 'MONTHLY' | 'YEARLY',
      exchangeRate: row.exchange_rate ? parseFloat(row.exchange_rate) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }
}

export class ExchangeRateRepository {
  async create(date: Date, usdToJpy: number): Promise<ExchangeRate> {
    const query = `
      INSERT INTO exchange_rates (date, usd_to_jpy)
      VALUES ($1, $2)
      ON CONFLICT (date) DO UPDATE SET usd_to_jpy = $2
      RETURNING id, date, usd_to_jpy, created_at
    `
    const result = await pool.query(query, [date, usdToJpy])
    return this.mapRowToExchangeRate(result.rows[0])
  }

  async findLatest(): Promise<ExchangeRate | null> {
    const query = `
      SELECT id, date, usd_to_jpy, created_at
      FROM exchange_rates
      ORDER BY date DESC
      LIMIT 1
    `
    const result = await pool.query(query)
    return result.rows[0] ? this.mapRowToExchangeRate(result.rows[0]) : null
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<ExchangeRate[]> {
    const query = `
      SELECT id, date, usd_to_jpy, created_at
      FROM exchange_rates
      WHERE date >= $1 AND date <= $2
      ORDER BY date DESC
    `
    const result = await pool.query(query, [startDate, endDate])
    return result.rows.map(this.mapRowToExchangeRate)
  }

  private mapRowToExchangeRate(row: ExchangeRateRow): ExchangeRate {
    return {
      id: row.id,
      date: new Date(row.date),
      usdToJpy: parseFloat(row.usd_to_jpy),
      createdAt: new Date(row.created_at)
    }
  }
}
