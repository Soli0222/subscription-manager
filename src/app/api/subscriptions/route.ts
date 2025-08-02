import { NextRequest, NextResponse } from 'next/server'
import { SubscriptionRepository } from '@/lib/repository'
import { getAverageExchangeRate } from '@/lib/exchange-rate'
import { z } from 'zod'

const subscriptionSchema = z.object({
  serviceName: z.string().min(1, 'サービス名を入力してください'),
  amount: z.number().positive('金額は正の数値を入力してください'),
  currency: z.enum(['JPY', 'USD']),
  startDate: z.string(),
  endDate: z.string().optional(),
  paymentCycle: z.enum(['MONTHLY', 'YEARLY'])
})

const subscriptionRepo = new SubscriptionRepository()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = subscriptionSchema.parse(body)

    // USD建ての場合は為替レートを取得
    let exchangeRate: number | undefined = undefined
    if (validatedData.currency === 'USD') {
      exchangeRate = await getAverageExchangeRate(new Date(validatedData.startDate))
    }

    const subscription = await subscriptionRepo.create({
      serviceName: validatedData.serviceName,
      amount: validatedData.amount,
      currency: validatedData.currency,
      startDate: new Date(validatedData.startDate),
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
      paymentCycle: validatedData.paymentCycle,
      exchangeRate
    })

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('サブスクリプション作成エラー:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'サブスクリプションの作成に失敗しました' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const subscriptions = await subscriptionRepo.findAll()

    return NextResponse.json(subscriptions)
  } catch (error) {
    console.error('サブスクリプション取得エラー:', error)
    return NextResponse.json(
      { error: 'サブスクリプションの取得に失敗しました' },
      { status: 500 }
    )
  }
}
