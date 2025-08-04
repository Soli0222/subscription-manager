import { SubscriptionRepository, ExchangeRateRepository } from '@/lib/repository'
import { Subscription, ExchangeRate } from '@/types'

// Mock the database pool
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}))

import pool from '@/lib/db'

describe('Repository Classes', () => {
  let subscriptionRepo: SubscriptionRepository
  let exchangeRateRepo: ExchangeRateRepository
  const mockQuery = pool.query as jest.MockedFunction<typeof pool.query>

  beforeEach(() => {
    jest.clearAllMocks()
    subscriptionRepo = new SubscriptionRepository()
    exchangeRateRepo = new ExchangeRateRepository()
  })

  describe('SubscriptionRepository', () => {
    describe('create', () => {
      it('should create a new subscription successfully', async () => {
        const mockRow = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          service_name: 'Netflix',
          amount: '1980',
          currency: 'JPY',
          start_date: new Date('2025-01-01'),
          end_date: null,
          payment_cycle: 'MONTHLY',
          exchange_rate: null,
          created_at: new Date('2025-01-01T10:00:00Z'),
          updated_at: new Date('2025-01-01T10:00:00Z'),
        }

        mockQuery.mockResolvedValue({ rows: [mockRow] } as any)

        const subscriptionData = {
          serviceName: 'Netflix',
          amount: 1980,
          currency: 'JPY' as const,
          startDate: new Date('2025-01-01'),
          endDate: undefined,
          paymentCycle: 'MONTHLY' as const,
          exchangeRate: undefined,
        }

        const result = await subscriptionRepo.create(subscriptionData)

        expect(mockQuery).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO subscriptions'),
          [
            'Netflix',
            1980,
            'JPY',
            new Date('2025-01-01'),
            null,
            'MONTHLY',
            null,
          ]
        )

        expect(result).toEqual({
          id: '123e4567-e89b-12d3-a456-426614174000',
          serviceName: 'Netflix',
          amount: 1980,
          currency: 'JPY',
          startDate: new Date('2025-01-01'),
          endDate: undefined,
          paymentCycle: 'MONTHLY',
          exchangeRate: undefined,
          createdAt: new Date('2025-01-01T10:00:00Z'),
          updatedAt: new Date('2025-01-01T10:00:00Z'),
        })
      })

      it('should create subscription with USD currency and exchange rate', async () => {
        const mockRow = {
          id: '123e4567-e89b-12d3-a456-426614174001',
          service_name: 'Spotify',
          amount: '9.99',
          currency: 'USD',
          start_date: new Date('2025-01-01'),
          end_date: null,
          payment_cycle: 'MONTHLY',
          exchange_rate: '150.5',
          created_at: new Date('2025-01-01T10:00:00Z'),
          updated_at: new Date('2025-01-01T10:00:00Z'),
        }

        mockQuery.mockResolvedValue({ rows: [mockRow] } as any)

        const subscriptionData = {
          serviceName: 'Spotify',
          amount: 9.99,
          currency: 'USD' as const,
          startDate: new Date('2025-01-01'),
          endDate: undefined,
          paymentCycle: 'MONTHLY' as const,
          exchangeRate: 150.5,
        }

        const result = await subscriptionRepo.create(subscriptionData)

        expect(result.exchangeRate).toBe(150.5)
        expect(result.currency).toBe('USD')
      })
    })

    describe('findAll', () => {
      it('should return all subscriptions ordered by created_at DESC', async () => {
        const mockRows = [
          {
            id: '1',
            service_name: 'Netflix',
            amount: '1980',
            currency: 'JPY',
            start_date: new Date('2025-01-01'),
            end_date: null,
            payment_cycle: 'MONTHLY',
            exchange_rate: null,
            created_at: new Date('2025-01-02'),
            updated_at: new Date('2025-01-02'),
          },
          {
            id: '2',
            service_name: 'Spotify',
            amount: '9.99',
            currency: 'USD',
            start_date: new Date('2025-01-01'),
            end_date: null,
            payment_cycle: 'MONTHLY',
            exchange_rate: '150.5',
            created_at: new Date('2025-01-01'),
            updated_at: new Date('2025-01-01'),
          },
        ]

        mockQuery.mockResolvedValue({ rows: mockRows } as any)

        const result = await subscriptionRepo.findAll()

        expect(mockQuery).toHaveBeenCalledWith(
          expect.stringContaining('ORDER BY created_at DESC')
        )
        expect(result).toHaveLength(2)
        expect(result[0].serviceName).toBe('Netflix')
        expect(result[1].serviceName).toBe('Spotify')
      })

      it('should return empty array when no subscriptions exist', async () => {
        mockQuery.mockResolvedValue({ rows: [] } as any)

        const result = await subscriptionRepo.findAll()

        expect(result).toEqual([])
      })
    })

    describe('findById', () => {
      it('should return subscription when found', async () => {
        const mockRow = {
          id: '123',
          service_name: 'Netflix',
          amount: '1980',
          currency: 'JPY',
          start_date: new Date('2025-01-01'),
          end_date: null,
          payment_cycle: 'MONTHLY',
          exchange_rate: null,
          created_at: new Date('2025-01-01'),
          updated_at: new Date('2025-01-01'),
        }

        mockQuery.mockResolvedValue({ rows: [mockRow] } as any)

        const result = await subscriptionRepo.findById('123')

        expect(mockQuery).toHaveBeenCalledWith(
          expect.stringContaining('WHERE id = $1'),
          ['123']
        )
        expect(result).not.toBeNull()
        expect(result?.id).toBe('123')
      })

      it('should return null when subscription not found', async () => {
        mockQuery.mockResolvedValue({ rows: [] } as any)

        const result = await subscriptionRepo.findById('nonexistent')

        expect(result).toBeNull()
      })
    })

    describe('update', () => {
      it('should update subscription successfully', async () => {
        const mockRow = {
          id: '123',
          service_name: 'Netflix Premium',
          amount: '2180',
          currency: 'JPY',
          start_date: new Date('2025-01-01'),
          end_date: null,
          payment_cycle: 'MONTHLY',
          exchange_rate: null,
          created_at: new Date('2025-01-01'),
          updated_at: new Date('2025-01-02'),
        }

        mockQuery.mockResolvedValue({ rows: [mockRow] } as any)

        const updateData = {
          serviceName: 'Netflix Premium',
          amount: 2180,
          currency: 'JPY' as const,
          startDate: new Date('2025-01-01'),
          endDate: undefined,
          paymentCycle: 'MONTHLY' as const,
          exchangeRate: undefined,
        }

        const result = await subscriptionRepo.update('123', updateData)

        expect(mockQuery).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE subscriptions'),
          [
            'Netflix Premium',
            2180,
            'JPY',
            new Date('2025-01-01'),
            null,
            'MONTHLY',
            null,
            '123',
          ]
        )
        expect(result.serviceName).toBe('Netflix Premium')
        expect(result.amount).toBe(2180)
      })
    })

    describe('delete', () => {
      it('should delete subscription successfully', async () => {
        mockQuery.mockResolvedValue({ rows: [] } as any)

        await subscriptionRepo.delete('123')

        expect(mockQuery).toHaveBeenCalledWith(
          'DELETE FROM subscriptions WHERE id = $1',
          ['123']
        )
      })
    })
  })

  describe('ExchangeRateRepository', () => {
    describe('create', () => {
      it('should create new exchange rate', async () => {
        const mockRow = {
          id: '1',
          date: '2025-01-01',
          usd_to_jpy: '150.5',
          created_at: '2025-01-01T10:00:00Z',
        }

        mockQuery.mockResolvedValue({ rows: [mockRow] } as any)

        const result = await exchangeRateRepo.create(new Date('2025-01-01'), 150.5)

        expect(mockQuery).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO exchange_rates'),
          [new Date('2025-01-01'), 150.5]
        )
        expect(result.usdToJpy).toBe(150.5)
      })

      it('should handle ON CONFLICT for duplicate dates', async () => {
        const mockRow = {
          id: '1',
          date: '2025-01-01',
          usd_to_jpy: '151.0',
          created_at: '2025-01-01T10:00:00Z',
        }

        mockQuery.mockResolvedValue({ rows: [mockRow] } as any)

        const result = await exchangeRateRepo.create(new Date('2025-01-01'), 151.0)

        expect(mockQuery).toHaveBeenCalledWith(
          expect.stringContaining('ON CONFLICT (date) DO UPDATE'),
          [new Date('2025-01-01'), 151.0]
        )
        expect(result.usdToJpy).toBe(151.0)
      })
    })

    describe('findLatest', () => {
      it('should return latest exchange rate', async () => {
        const mockRow = {
          id: '1',
          date: '2025-01-15',
          usd_to_jpy: '149.8',
          created_at: '2025-01-15T10:00:00Z',
        }

        mockQuery.mockResolvedValue({ rows: [mockRow] } as any)

        const result = await exchangeRateRepo.findLatest()

        expect(mockQuery).toHaveBeenCalledWith(
          expect.stringContaining('ORDER BY date DESC')
        )
        expect(result).not.toBeNull()
        expect(result?.usdToJpy).toBe(149.8)
      })

      it('should return null when no rates exist', async () => {
        mockQuery.mockResolvedValue({ rows: [] } as any)

        const result = await exchangeRateRepo.findLatest()

        expect(result).toBeNull()
      })
    })

    describe('findByDateRange', () => {
      it('should return exchange rates within date range', async () => {
        const mockRows = [
          {
            id: '1',
            date: '2025-01-15',
            usd_to_jpy: '149.8',
            created_at: '2025-01-15T10:00:00Z',
          },
          {
            id: '2',
            date: '2025-01-10',
            usd_to_jpy: '148.5',
            created_at: '2025-01-10T10:00:00Z',
          },
        ]

        mockQuery.mockResolvedValue({ rows: mockRows } as any)

        const startDate = new Date('2025-01-01')
        const endDate = new Date('2025-01-31')
        const result = await exchangeRateRepo.findByDateRange(startDate, endDate)

        expect(mockQuery).toHaveBeenCalledWith(
          expect.stringContaining('WHERE date >= $1 AND date <= $2'),
          [startDate, endDate]
        )
        expect(result).toHaveLength(2)
        expect(result[0].usdToJpy).toBe(149.8)
      })

      it('should return empty array when no rates in range', async () => {
        mockQuery.mockResolvedValue({ rows: [] } as any)

        const result = await exchangeRateRepo.findByDateRange(
          new Date('2025-01-01'),
          new Date('2025-01-31')
        )

        expect(result).toEqual([])
      })
    })
  })
})