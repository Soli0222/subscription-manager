'use client'

import { useState, useEffect, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MonthlySummary } from '@/types'

interface MonthlyChartProps {
  refreshTrigger?: number
}

export default function MonthlyChart({ refreshTrigger }: MonthlyChartProps) {
  const [data, setData] = useState<MonthlySummary[]>([])
  const [loading, setLoading] = useState(true)
  
  // デフォルト期間設定（1年前から1年後）
  const now = new Date()
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1)
  const oneYearLater = new Date(now.getFullYear() + 1, now.getMonth(), 1)
  
  const [startDate, setStartDate] = useState(oneYearAgo.toISOString().slice(0, 7))
  const [endDate, setEndDate] = useState(oneYearLater.toISOString().slice(0, 7))
  
  // 期間変更用の内部状態（実際のAPIリクエストとは分離）
  const [currentStartDate, setCurrentStartDate] = useState(oneYearAgo.toISOString().slice(0, 7))
  const [currentEndDate, setCurrentEndDate] = useState(oneYearLater.toISOString().slice(0, 7))

  const fetchMonthlyData = useCallback(async () => {
    setLoading(true)
    try {
      const startMonth = currentStartDate
      const endMonth = currentEndDate
      const response = await fetch(`/api/reports/monthly-summary?startMonth=${startMonth}&endMonth=${endMonth}`)
      const monthlyData = await response.json()
      setData(monthlyData)
    } catch (error) {
      console.error('月次データ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }, [currentStartDate, currentEndDate])

  const handleUpdateChart = () => {
    setCurrentStartDate(startDate)
    setCurrentEndDate(endDate)
  }

  useEffect(() => {
    fetchMonthlyData()
  }, [fetchMonthlyData, refreshTrigger])

  const formatXAxisLabel = (tickItem: string) => {
    const [year, month] = tickItem.split('-')
    return `${year}/${month}`
  }

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: Array<{
      value: number
      payload: MonthlySummary
    }>
    label?: string
  }) => {
    if (active && payload && payload.length && label) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-4">
          <p className="font-medium text-foreground">{formatXAxisLabel(label)}</p>
          <p className="text-sm text-muted-foreground">
            合計: <span className="font-medium text-primary">¥{payload[0].value.toLocaleString()}</span>
          </p>
          {data.subscriptions && data.subscriptions.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-muted-foreground">内訳:</p>
              {data.subscriptions.map((sub, index: number) => (
                <p key={index} className="text-xs text-foreground">
                  {sub.serviceName}: ¥{sub.amountInJpy.toLocaleString()}
                </p>
              ))}
            </div>
          )}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="text-muted-foreground">チャートを読み込み中...</div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="text-muted-foreground">データがありません</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 期間選択UI */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-2">
          <Label htmlFor="start-date">開始月</Label>
          <Input
            id="start-date"
            type="month"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end-date">終了月</Label>
          <Input
            id="end-date"
            type="month"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40"
          />
        </div>
        <Button onClick={handleUpdateChart} variant="outline">
          更新
        </Button>
      </div>

      {/* チャート */}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              tickFormatter={formatXAxisLabel}
              fontSize={12}
              className="fill-muted-foreground"
            />
            <YAxis 
              tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}K`}
              fontSize={12}
              className="fill-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone"
              dataKey="totalAmount" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
