import type { Currency, PaymentCycle, Subscription, ExchangeRate, SubscriptionFormData, MonthlySummary, DashboardStats } from '@/types'

describe('Type Definitions', () => {
  describe('Currency type', () => {
    it('should only allow JPY or USD', () => {
      const jpyCurrency: Currency = 'JPY'
      const usdCurrency: Currency = 'USD'
      
      expect(jpyCurrency).toBe('JPY')
      expect(usdCurrency).toBe('USD')
      
      // TypeScript would catch invalid currencies at compile time
      // This test confirms the valid values
      const validCurrencies: Currency[] = ['JPY', 'USD']
      expect(validCurrencies).toHaveLength(2)
    })
  })

  describe('PaymentCycle type', () => {
    it('should only allow MONTHLY or YEARLY', () => {
      const monthlyCycle: PaymentCycle = 'MONTHLY'
      const yearlyCycle: PaymentCycle = 'YEARLY'
      
      expect(monthlyCycle).toBe('MONTHLY')
      expect(yearlyCycle).toBe('YEARLY')
      
      const validCycles: PaymentCycle[] = ['MONTHLY', 'YEARLY']
      expect(validCycles).toHaveLength(2)
    })
  })

  describe('Subscription interface', () => {
    it('should have all required properties', () => {
      const subscription: Subscription = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        serviceName: 'Netflix',
        amount: 1980,
        currency: 'JPY',
        startDate: new Date('2025-01-01'),
        paymentCycle: 'MONTHLY',
        createdAt: new Date('2025-01-01T10:00:00Z'),
        updatedAt: new Date('2025-01-01T10:00:00Z')
      }
      
      expect(subscription.id).toBeDefined()
      expect(subscription.serviceName).toBeDefined()
      expect(subscription.amount).toBeDefined()
      expect(subscription.currency).toBeDefined()
      expect(subscription.startDate).toBeDefined()
      expect(subscription.paymentCycle).toBeDefined()
      expect(subscription.createdAt).toBeDefined()
      expect(subscription.updatedAt).toBeDefined()
    })

    it('should allow optional properties', () => {
      const subscriptionWithOptionals: Subscription = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        serviceName: 'Spotify',
        amount: 9.99,
        currency: 'USD',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'), // Optional
        paymentCycle: 'MONTHLY',
        exchangeRate: 150.5, // Optional
        createdAt: new Date('2025-01-01T10:00:00Z'),
        updatedAt: new Date('2025-01-01T10:00:00Z')
      }
      
      expect(subscriptionWithOptionals.endDate).toBeDefined()
      expect(subscriptionWithOptionals.exchangeRate).toBeDefined()
    })
  })

  describe('ExchangeRate interface', () => {
    it('should have all required properties', () => {
      const exchangeRate: ExchangeRate = {
        id: '1',
        date: new Date('2025-01-01'),
        usdToJpy: 150.5,
        createdAt: new Date('2025-01-01T10:00:00Z')
      }
      
      expect(exchangeRate.id).toBeDefined()
      expect(exchangeRate.date).toBeDefined()
      expect(exchangeRate.usdToJpy).toBeDefined()
      expect(exchangeRate.createdAt).toBeDefined()
    })
  })

  describe('SubscriptionFormData interface', () => {
    it('should match form input structure', () => {
      const formData: SubscriptionFormData = {
        serviceName: 'Netflix',
        amount: 1980,
        currency: 'JPY',
        startDate: '2025-01-01', // String format for forms
        paymentCycle: 'MONTHLY'
      }
      
      expect(typeof formData.startDate).toBe('string')
      expect(formData.endDate).toBeUndefined() // Optional
    })

    it('should allow optional endDate', () => {
      const formDataWithEnd: SubscriptionFormData = {
        serviceName: 'Adobe',
        amount: 52800,
        currency: 'JPY',
        startDate: '2025-01-01',
        endDate: '2025-12-31', // Optional end date
        paymentCycle: 'YEARLY'
      }
      
      expect(formDataWithEnd.endDate).toBe('2025-12-31')
    })
  })

  describe('MonthlySummary interface', () => {
    it('should structure monthly report data correctly', () => {
      const summary: MonthlySummary = {
        month: '2025-01',
        totalAmount: 15800,
        subscriptions: [
          {
            serviceName: 'Netflix',
            amount: 1980,
            currency: 'JPY',
            amountInJpy: 1980
          },
          {
            serviceName: 'Spotify',
            amount: 9.99,
            currency: 'USD',
            amountInJpy: 1499 // Converted amount
          }
        ]
      }
      
      expect(summary.month).toBe('2025-01')
      expect(summary.totalAmount).toBe(15800)
      expect(summary.subscriptions).toHaveLength(2)
      expect(summary.subscriptions[0].amountInJpy).toBeDefined()
    })
  })

  describe('DashboardStats interface', () => {
    it('should structure dashboard statistics correctly', () => {
      const stats: DashboardStats = {
        totalActiveSubscriptions: 5,
        currentMonthTotal: 15800,
        upcomingRenewals: [
          {
            id: '1',
            serviceName: 'Netflix',
            amount: 1980,
            currency: 'JPY',
            startDate: new Date('2025-01-01'),
            paymentCycle: 'MONTHLY',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      }
      
      expect(stats.totalActiveSubscriptions).toBe(5)
      expect(stats.currentMonthTotal).toBe(15800)
      expect(Array.isArray(stats.upcomingRenewals)).toBe(true)
    })
  })
})