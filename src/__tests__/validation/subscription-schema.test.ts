import { z } from 'zod'

// Test the same schema used in the API routes
const subscriptionSchema = z.object({
  serviceName: z.string().min(1, 'サービス名を入力してください'),
  amount: z.number().positive('金額は正の数値を入力してください'),
  currency: z.enum(['JPY', 'USD']),
  startDate: z.string(),
  endDate: z.string().optional(),
  paymentCycle: z.enum(['MONTHLY', 'YEARLY'])
})

describe('Subscription Validation Schema', () => {
  describe('Valid data', () => {
    it('should validate correct JPY subscription data', () => {
      const validData = {
        serviceName: 'Netflix',
        amount: 1980,
        currency: 'JPY' as const,
        startDate: '2025-01-01',
        paymentCycle: 'MONTHLY' as const
      }

      const result = subscriptionSchema.safeParse(validData)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should validate correct USD subscription data', () => {
      const validData = {
        serviceName: 'Spotify',
        amount: 9.99,
        currency: 'USD' as const,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        paymentCycle: 'MONTHLY' as const
      }

      const result = subscriptionSchema.safeParse(validData)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should validate yearly payment cycle', () => {
      const validData = {
        serviceName: 'Adobe Creative Cloud',
        amount: 52800,
        currency: 'JPY' as const,
        startDate: '2025-01-01',
        paymentCycle: 'YEARLY' as const
      }

      const result = subscriptionSchema.safeParse(validData)
      
      expect(result.success).toBe(true)
    })
  })

  describe('Invalid data', () => {
    it('should reject empty service name', () => {
      const invalidData = {
        serviceName: '',
        amount: 1980,
        currency: 'JPY' as const,
        startDate: '2025-01-01',
        paymentCycle: 'MONTHLY' as const
      }

      const result = subscriptionSchema.safeParse(invalidData)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('サービス名を入力してください')
      }
    })

    it('should reject negative amount', () => {
      const invalidData = {
        serviceName: 'Netflix',
        amount: -100,
        currency: 'JPY' as const,
        startDate: '2025-01-01',
        paymentCycle: 'MONTHLY' as const
      }

      const result = subscriptionSchema.safeParse(invalidData)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('金額は正の数値を入力してください')
      }
    })

    it('should reject zero amount', () => {
      const invalidData = {
        serviceName: 'Netflix',
        amount: 0,
        currency: 'JPY' as const,
        startDate: '2025-01-01',
        paymentCycle: 'MONTHLY' as const
      }

      const result = subscriptionSchema.safeParse(invalidData)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('金額は正の数値を入力してください')
      }
    })

    it('should reject invalid currency', () => {
      const invalidData = {
        serviceName: 'Netflix',
        amount: 1980,
        currency: 'EUR' as 'JPY' | 'USD',
        startDate: '2025-01-01',
        paymentCycle: 'MONTHLY' as const
      }

      const result = subscriptionSchema.safeParse(invalidData)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['currency'])
        // Just check that an error occurred for invalid enum value
        expect(result.error.issues[0].code).toContain('invalid')
      }
    })

    it('should reject invalid payment cycle', () => {
      const invalidData = {
        serviceName: 'Netflix',
        amount: 1980,
        currency: 'JPY' as const,
        startDate: '2025-01-01',
        paymentCycle: 'QUARTERLY' as 'MONTHLY' | 'YEARLY'
      }

      const result = subscriptionSchema.safeParse(invalidData)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['paymentCycle'])
        // Just check that an error occurred for invalid enum value
        expect(result.error.issues[0].code).toContain('invalid')
      }
    })

    it('should reject missing required fields', () => {
      const invalidData = {
        serviceName: 'Netflix'
        // Missing amount, currency, startDate, paymentCycle
      }

      const result = subscriptionSchema.safeParse(invalidData)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(1)
        const missingFields = result.error.issues.map(issue => issue.path[0])
        expect(missingFields).toContain('amount')
        expect(missingFields).toContain('currency')
        expect(missingFields).toContain('startDate')
        expect(missingFields).toContain('paymentCycle')
      }
    })
  })

  describe('Edge cases', () => {
    it('should handle very small decimal amounts', () => {
      const validData = {
        serviceName: 'Test Service',
        amount: 0.01,
        currency: 'USD' as const,
        startDate: '2025-01-01',
        paymentCycle: 'MONTHLY' as const
      }

      const result = subscriptionSchema.safeParse(validData)
      
      expect(result.success).toBe(true)
    })

    it('should handle very large amounts', () => {
      const validData = {
        serviceName: 'Enterprise Software',
        amount: 999999.99,
        currency: 'USD' as const,
        startDate: '2025-01-01',
        paymentCycle: 'YEARLY' as const
      }

      const result = subscriptionSchema.safeParse(validData)
      
      expect(result.success).toBe(true)
    })

    it('should allow optional endDate to be undefined', () => {
      const validData = {
        serviceName: 'Netflix',
        amount: 1980,
        currency: 'JPY' as const,
        startDate: '2025-01-01',
        paymentCycle: 'MONTHLY' as const
        // endDate is optional and not provided
      }

      const result = subscriptionSchema.safeParse(validData)
      
      expect(result.success).toBe(true)
    })
  })
})