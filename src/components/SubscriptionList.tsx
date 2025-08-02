'use client'

import { useState } from 'react'
import { Subscription } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

interface SubscriptionListProps {
  subscriptions: Subscription[]
  onEdit: (subscription: Subscription) => void
  onUpdate: () => void
}

export default function SubscriptionList({ subscriptions, onEdit, onUpdate }: SubscriptionListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('このサブスクリプションを削除しますか？')) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onUpdate()
      } else {
        alert('削除に失敗しました')
      }
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました')
    } finally {
      setDeletingId(null)
    }
  }

  const formatAmount = (amount: number, currency: string, paymentCycle: string) => {
    const symbol = currency === 'JPY' ? '¥' : '$'
    const cycle = paymentCycle === 'MONTHLY' ? '/月' : '/年'
    return `${symbol}${amount.toLocaleString()}${cycle}`
  }

  const getStatusBadge = (subscription: Subscription) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startDate = new Date(subscription.startDate)
    const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
    
    let endDateOnly = null
    if (subscription.endDate) {
      const endDate = new Date(subscription.endDate)
      endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
    }
    
    const isActive = startDateOnly <= today && (!endDateOnly || endDateOnly >= today)
    
    if (isActive) {
      return <Badge variant="default">有効</Badge>
    } else if (startDateOnly > today) {
      return <Badge variant="secondary">開始前</Badge>
    } else {
      return <Badge variant="outline">終了</Badge>
    }
  }

  const isSubscriptionActive = (subscription: Subscription) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startDate = new Date(subscription.startDate)
    const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
    
    let endDateOnly = null
    if (subscription.endDate) {
      const endDate = new Date(subscription.endDate)
      endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
    }
    
    return startDateOnly <= today && (!endDateOnly || endDateOnly >= today)
  }

  const activeSubscriptions = subscriptions.filter(isSubscriptionActive)
  const inactiveSubscriptions = subscriptions.filter(sub => !isSubscriptionActive(sub))

  const renderSubscriptionTable = (subscriptionList: Subscription[]) => {
    if (subscriptionList.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          該当するサブスクリプションがありません
        </div>
      )
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>サービス名</TableHead>
            <TableHead>金額</TableHead>
            <TableHead>開始日</TableHead>
            <TableHead>終了日</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead className="w-[100px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptionList.map((subscription) => (
            <TableRow key={subscription.id}>
              <TableCell className="font-medium">
                {subscription.serviceName}
              </TableCell>
              <TableCell>
                {formatAmount(subscription.amount, subscription.currency, subscription.paymentCycle)}
                {subscription.currency === 'USD' && subscription.exchangeRate && (
                  <div className="text-sm text-muted-foreground">
                    (¥{Math.round(subscription.amount * subscription.exchangeRate).toLocaleString()})
                  </div>
                )}
              </TableCell>
              <TableCell>
                {format(new Date(subscription.startDate), 'yyyy/MM/dd')}
              </TableCell>
              <TableCell>
                {subscription.endDate 
                  ? format(new Date(subscription.endDate), 'yyyy/MM/dd')
                  : '無期限'
                }
              </TableCell>
              <TableCell>
                {getStatusBadge(subscription)}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(subscription)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(subscription.id)}
                    disabled={deletingId === subscription.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        まだサブスクリプションが登録されていません
      </div>
    )
  }

  return (
    <Tabs defaultValue="active" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="active">
          有効 ({activeSubscriptions.length})
        </TabsTrigger>
        <TabsTrigger value="inactive">
          終了 ({inactiveSubscriptions.length})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="active">
        {renderSubscriptionTable(activeSubscriptions)}
      </TabsContent>
      <TabsContent value="inactive">
        {renderSubscriptionTable(inactiveSubscriptions)}
      </TabsContent>
    </Tabs>
  )
}
