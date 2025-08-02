import { NextRequest, NextResponse } from 'next/server'
import { SubscriptionRepository } from '@/lib/repository'
import { convertToJpy } from '@/lib/exchange-rate'
import { startOfMonth, endOfMonth, addMonths, format, parseISO } from 'date-fns'

const subscriptionRepo = new SubscriptionRepository()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startMonth = searchParams.get('startMonth')
    const endMonth = searchParams.get('endMonth')
    const monthsParam = searchParams.get('months')

    let startDate: Date
    let endDate: Date

    if (startMonth && endMonth) {
      // 期間指定がある場合
      startDate = parseISO(`${startMonth}-01`)
      endDate = parseISO(`${endMonth}-01`)
    } else {
      // 従来の月数指定（互換性維持）
      const months = monthsParam ? parseInt(monthsParam) : 12
      const currentDate = new Date()
      startDate = addMonths(currentDate, -(months - 1))
      endDate = currentDate
    }

    const subscriptions = await subscriptionRepo.findAll()
    
    const monthlySummaries = []
    let currentMonth = startOfMonth(startDate)
    
    while (currentMonth <= endOfMonth(endDate)) {
      const monthStart = startOfMonth(currentMonth)
      const monthEnd = endOfMonth(currentMonth)
      
      let totalAmount = 0
      const monthSubscriptions = []
      
      for (const subscription of subscriptions) {
        // このサブスクリプションが対象月にアクティブかチェック
        const isActive = subscription.startDate <= monthEnd && 
          (!subscription.endDate || subscription.endDate >= monthStart)
        
        if (!isActive) continue
        
        // 支払い額を計算（年次の場合は支払い月のみ計上）
        let paymentAmount = 0
        if (subscription.paymentCycle === 'YEARLY') {
          // 年次支払いの場合、開始月または更新月のみ計上
          const startMonth = subscription.startDate.getMonth()
          const startYear = subscription.startDate.getFullYear()
          const currentMonthNum = currentMonth.getMonth()
          const currentYear = currentMonth.getFullYear()
          
          // 開始年の開始月、または毎年の同じ月に支払いが発生
          if (currentMonthNum === startMonth && currentYear >= startYear) {
            paymentAmount = subscription.amount
          }
        } else {
          // 月次支払いの場合は毎月計上
          paymentAmount = subscription.amount
        }
        
        // 円に換算
        const amountInJpy = convertToJpy(
          paymentAmount, 
          subscription.currency, 
          subscription.exchangeRate || undefined
        )
        
        totalAmount += amountInJpy
        
        // 支払いがある場合のみ記録に追加
        if (paymentAmount > 0) {
          monthSubscriptions.push({
            serviceName: subscription.serviceName,
            amount: paymentAmount,
            currency: subscription.currency,
            amountInJpy
          })
        }
      }
      
      monthlySummaries.push({
        month: format(currentMonth, 'yyyy-MM'),
        totalAmount: Math.round(totalAmount),
        subscriptions: monthSubscriptions
      })
      
      currentMonth = addMonths(currentMonth, 1)
    }

    return NextResponse.json(monthlySummaries)
  } catch (error) {
    console.error('月次サマリー取得エラー:', error)
    return NextResponse.json(
      { error: '月次サマリーの取得に失敗しました' },
      { status: 500 }
    )
  }
}
