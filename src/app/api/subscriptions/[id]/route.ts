import { NextRequest, NextResponse } from 'next/server'
import { SubscriptionRepository } from '@/lib/repository'
import { getAverageExchangeRate } from '@/lib/exchange-rate'
import { z } from 'zod'

const subscriptionUpdateSchema = z.object({
  serviceName: z.string().min(1, 'サービス名を入力してください'),
  amount: z.number().positive('金額は正の数値を入力してください'),
  currency: z.enum(['JPY', 'USD']),
  startDate: z.string(),
  endDate: z.string().optional(),
  paymentCycle: z.enum(['MONTHLY', 'YEARLY'])
})

const subscriptionRepo = new SubscriptionRepository()

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    const subscription = await subscriptionRepo.findById(id)

    if (!subscription) {
      return NextResponse.json(
        { error: 'サブスクリプションが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('サブスクリプション取得エラー:', error)
    return NextResponse.json(
      { error: 'サブスクリプションの取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    const body = await request.json()
    const validatedData = subscriptionUpdateSchema.parse(body)

    // USD建ての場合は為替レートを更新
    let exchangeRate: number | undefined = undefined
    if (validatedData.currency === 'USD') {
      exchangeRate = await getAverageExchangeRate(new Date(validatedData.startDate))
    }

    const subscription = await subscriptionRepo.update(id, {
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
    console.error('サブスクリプション更新エラー:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'サブスクリプションの更新に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/subscriptions/{id}:
 *   delete:
 *     summary: サブスクリプションを削除
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: サブスクリプションID
 *     responses:
 *       200:
 *         description: サブスクリプション削除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "サブスクリプションを削除しました"
 *       500:
 *         description: サーバーエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    await subscriptionRepo.delete(id)

    return NextResponse.json({ message: 'サブスクリプションを削除しました' })
  } catch (error) {
    console.error('サブスクリプション削除エラー:', error)
    return NextResponse.json(
      { error: 'サブスクリプションの削除に失敗しました' },
      { status: 500 }
    )
  }
}
