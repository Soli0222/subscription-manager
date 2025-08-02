export type Currency = 'JPY' | 'USD'
export type PaymentCycle = 'MONTHLY' | 'YEARLY'

export interface Subscription {
  id: string
  serviceName: string
  amount: number
  currency: Currency
  startDate: Date
  endDate?: Date
  paymentCycle: PaymentCycle
  exchangeRate?: number
  createdAt: Date
  updatedAt: Date
}

export interface ExchangeRate {
  id: string
  date: Date
  usdToJpy: number
  createdAt: Date
}

export interface SubscriptionFormData {
  serviceName: string
  amount: number
  currency: Currency
  startDate: string
  endDate?: string
  paymentCycle: PaymentCycle
}

export interface MonthlySummary {
  month: string
  totalAmount: number
  subscriptions: {
    serviceName: string
    amount: number
    currency: Currency
    amountInJpy: number
  }[]
}

export interface DashboardStats {
  totalActiveSubscriptions: number
  currentMonthTotal: number
  upcomingRenewals: Subscription[]
}
