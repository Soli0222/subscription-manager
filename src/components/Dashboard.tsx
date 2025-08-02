'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, TrendingUp, DollarSign } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import SubscriptionList from './SubscriptionList'
import SubscriptionForm from './SubscriptionForm'
import MonthlyChart from './MonthlyChart'
import { Subscription, DashboardStats } from '@/types'

export default function Dashboard() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartRefreshTrigger, setChartRefreshTrigger] = useState(0)

  useEffect(() => {
    fetchSubscriptions()
    fetchStats()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/subscriptions')
      const data = await response.json()
      setSubscriptions(data)
    } catch (error) {
      console.error('サブスクリプション取得エラー:', error)
    }
  }

  const fetchStats = async () => {
    try {
      // 現在のサブスクリプションから統計を計算
      const response = await fetch('/api/subscriptions')
      const subscriptions: Subscription[] = await response.json()
      
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      // アクティブなサブスクリプションを正しく判定
      const activeSubscriptions = subscriptions.filter(sub => {
        const startDate = new Date(sub.startDate)
        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
        
        let endDateOnly = null
        if (sub.endDate) {
          const endDate = new Date(sub.endDate)
          endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
        }
        
        const isActive = startDateOnly <= today && (!endDateOnly || endDateOnly >= today)
        
        return isActive
      })
      
      let currentMonthTotal = 0
      activeSubscriptions.forEach(sub => {
        let monthlyPayment = 0
        
        if (sub.paymentCycle === 'YEARLY') {
          // 年次支払いの場合、今月が支払い月かチェック
          const startMonth = new Date(sub.startDate).getMonth()
          const currentMonth = now.getMonth()
          if (currentMonth === startMonth) {
            monthlyPayment = sub.amount
          }
        } else {
          // 月次支払いの場合は毎月
          monthlyPayment = sub.amount
        }
        
        if (sub.currency === 'USD' && sub.exchangeRate) {
          monthlyPayment *= sub.exchangeRate
        }
        
        currentMonthTotal += monthlyPayment
      })
      
      // 今後30日以内に更新予定のサブスクリプション
      const upcomingRenewals = activeSubscriptions.filter(sub => {
        if (!sub.endDate) return false
        const endDate = new Date(sub.endDate)
        const daysUntilRenewal = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntilRenewal <= 30 && daysUntilRenewal > 0
      })
      
      setStats({
        totalActiveSubscriptions: activeSubscriptions.length,
        currentMonthTotal: Math.round(currentMonthTotal),
        upcomingRenewals
      })
    } catch (error) {
      console.error('統計データ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSubscription = () => {
    setEditingSubscription(null)
    setIsFormOpen(true)
  }

  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription)
    setIsFormOpen(true)
  }

  const handleFormSubmit = async () => {
    await fetchSubscriptions()
    await fetchStats()
    setChartRefreshTrigger(prev => prev + 1) // チャートを更新
    setIsFormOpen(false)
    setEditingSubscription(null)
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setEditingSubscription(null)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">サブスクリプション管理</h1>
          <p className="text-muted-foreground">
            サブスクリプションサービスの管理と支払い状況を確認
          </p>
        </div>
        <div className="flex gap-2">
          <ThemeToggle />
          <Button onClick={handleAddSubscription}>
            <Plus className="mr-2 h-4 w-4" />
            新規登録
          </Button>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              アクティブなサブスクリプション
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalActiveSubscriptions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              現在有効なサービス数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              今月の支払い総額
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{stats?.currentMonthTotal?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              今月の支払い予定額
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              更新予定
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.upcomingRenewals?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              30日以内に更新
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 更新予定の警告 */}
      {stats?.upcomingRenewals && stats.upcomingRenewals.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardHeader>
            <CardTitle className="text-orange-800 dark:text-orange-200">更新予定のサブスクリプション</CardTitle>
            <CardDescription className="text-orange-600 dark:text-orange-400">
              以下のサブスクリプションが30日以内に更新されます
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.upcomingRenewals.map((sub) => (
                <div key={sub.id} className="flex justify-between items-center p-2 bg-white dark:bg-orange-900 rounded">
                  <span className="font-medium text-orange-900 dark:text-orange-100">{sub.serviceName}</span>
                  <Badge variant="outline" className="border-orange-300 text-orange-700 dark:border-orange-600 dark:text-orange-300">
                    {sub.endDate ? new Date(sub.endDate).toLocaleDateString('ja-JP') : ''}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* チャート */}
      <Card>
        <CardHeader>
          <CardTitle>月次支払い推移</CardTitle>
          <CardDescription>
            期間を指定して支払い額の推移を確認できます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MonthlyChart refreshTrigger={chartRefreshTrigger} />
        </CardContent>
      </Card>

      {/* サブスクリプション一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>サブスクリプション一覧</CardTitle>
          <CardDescription>
            登録済みのサブスクリプションサービス
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionList 
            subscriptions={subscriptions}
            onEdit={handleEditSubscription}
            onUpdate={fetchSubscriptions}
          />
        </CardContent>
      </Card>

      {/* フォームダイアログ */}
      {isFormOpen && (
        <SubscriptionForm
          subscription={editingSubscription}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  )
}
