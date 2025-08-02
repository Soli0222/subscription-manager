'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Subscription, SubscriptionFormData } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { format } from 'date-fns'

const subscriptionFormSchema = z.object({
  serviceName: z.string().min(1, 'サービス名を入力してください'),
  amount: z.number().positive('金額は正の数値を入力してください'),
  currency: z.enum(['JPY', 'USD']),
  startDate: z.string(),
  endDate: z.string().optional(),
  paymentCycle: z.enum(['MONTHLY', 'YEARLY'])
})

interface SubscriptionFormProps {
  subscription?: Subscription | null
  onSubmit: () => void
  onCancel: () => void
}

export default function SubscriptionForm({ subscription, onSubmit, onCancel }: SubscriptionFormProps) {
  const [loading, setLoading] = useState(false)
  const [currency, setCurrency] = useState<'JPY' | 'USD'>(subscription?.currency || 'JPY')
  const [paymentCycle, setPaymentCycle] = useState<'MONTHLY' | 'YEARLY'>(subscription?.paymentCycle || 'MONTHLY')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: {
      serviceName: subscription?.serviceName || '',
      amount: subscription?.amount || 0,
      currency: subscription?.currency || 'JPY',
      startDate: subscription?.startDate 
        ? format(new Date(subscription.startDate), 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      endDate: subscription?.endDate 
        ? format(new Date(subscription.endDate), 'yyyy-MM-dd')
        : '',
      paymentCycle: subscription?.paymentCycle || 'MONTHLY'
    }
  })

  const onFormSubmit = async (data: SubscriptionFormData) => {
    setLoading(true)
    try {
      const url = subscription 
        ? `/api/subscriptions/${subscription.id}` 
        : '/api/subscriptions'
      
      const method = subscription ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          amount: Number(data.amount)
        }),
      })

      if (response.ok) {
        onSubmit()
      } else {
        const error = await response.json()
        alert(error.error || '保存に失敗しました')
      }
    } catch (error) {
      console.error('フォーム送信エラー:', error)
      alert('保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleCurrencyChange = (value: 'JPY' | 'USD') => {
    setCurrency(value)
    setValue('currency', value)
  }

  const handlePaymentCycleChange = (value: 'MONTHLY' | 'YEARLY') => {
    setPaymentCycle(value)
    setValue('paymentCycle', value)
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {subscription ? 'サブスクリプション編集' : '新規サブスクリプション登録'}
          </DialogTitle>
          <DialogDescription>
            サブスクリプションサービスの詳細情報を入力してください。
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serviceName">サービス名</Label>
            <Input
              id="serviceName"
              placeholder="例: Netflix"
              {...register('serviceName')}
            />
            {errors.serviceName && (
              <p className="text-sm text-red-600">{errors.serviceName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">金額</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="1000"
                {...register('amount', { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">通貨</Label>
              <Select value={currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JPY">円 (JPY)</SelectItem>
                  <SelectItem value="USD">ドル (USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentCycle">支払いサイクル</Label>
            <Select value={paymentCycle} onValueChange={handlePaymentCycleChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY">月次</SelectItem>
                <SelectItem value="YEARLY">年次</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">開始日</Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate')}
              />
              {errors.startDate && (
                <p className="text-sm text-red-600">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">終了日 (任意)</Label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate')}
              />
              {errors.endDate && (
                <p className="text-sm text-red-600">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
