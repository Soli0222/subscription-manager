import { ExchangeRateRepository } from './repository'
import { subDays } from 'date-fns'

const exchangeRateRepo = new ExchangeRateRepository()

export async function getCurrentExchangeRate(): Promise<number> {
  try {
    // 最新の為替レートを取得
    const latestRate = await exchangeRateRepo.findLatest()

    // 24時間以内のデータがあればそれを使用
    if (latestRate && latestRate.date > subDays(new Date(), 1)) {
      return latestRate.usdToJpy
    }

    // 新しいレートを外部APIから取得
    const response = await fetch(process.env.EXCHANGE_RATE_API_URL || 'https://api.exchangerate-api.com/v4/latest/USD')
    const data = await response.json()
    const rate = data.rates.JPY

    // データベースに保存
    await exchangeRateRepo.create(new Date(), rate)

    return rate
  } catch (error) {
    console.error('為替レート取得エラー:', error)
    // フォールバック値として固定レートを返す
    return 150
  }
}

export async function getAverageExchangeRate(fromDate: Date, days: number = 30): Promise<number> {
  const startDate = subDays(fromDate, days)
  
  try {
    const rates = await exchangeRateRepo.findByDateRange(startDate, fromDate)

    if (rates.length === 0) {
      // データがない場合は現在のレートを取得
      return await getCurrentExchangeRate()
    }

    const average = rates.reduce((sum: number, rate) => sum + rate.usdToJpy, 0) / rates.length
    return Math.round(average * 100) / 100
  } catch (error) {
    console.error('平均為替レート取得エラー:', error)
    return 150
  }
}

export function convertToJpy(amount: number, currency: 'JPY' | 'USD', exchangeRate?: number): number {
  if (currency === 'JPY') {
    return amount
  }
  
  if (currency === 'USD' && exchangeRate) {
    return Math.round(amount * exchangeRate)
  }
  
  // フォールバック
  return Math.round(amount * 150)
}
