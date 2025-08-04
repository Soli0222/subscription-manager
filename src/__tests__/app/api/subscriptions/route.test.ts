import { POST, GET } from '@/app/api/subscriptions/route'
import { NextRequest } from 'next/server'

// Mock the repository and exchange rate modules
jest.mock('@/lib/repository', () => ({
  SubscriptionRepository: jest.fn().mockImplementation(() => ({
    create: jest.fn(),
    findAll: jest.fn(),
  })),
}))

jest.mock('@/lib/exchange-rate', () => ({
  getAverageExchangeRate: jest.fn(),
}))

import { SubscriptionRepository } from '@/lib/repository'
import { getAverageExchangeRate } from '@/lib/exchange-rate'

describe('/api/subscriptions', () => {
  let mockSubscriptionRepo: jest.Mocked<SubscriptionRepository>
  let mockGetAverageExchangeRate: jest.MockedFunction<typeof getAverageExchangeRate>

  beforeEach(() => {
    jest.clearAllMocks()
    mockSubscriptionRepo = new SubscriptionRepository() as jest.Mocked<SubscriptionRepository>
    mockGetAverageExchangeRate = getAverageExchangeRate as jest.MockedFunction<typeof getAverageExchangeRate>
  })

  describe('POST /api/subscriptions', () => {
    it('should create JPY subscription successfully', async () => {
      const mockSubscription = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        serviceName: 'Netflix',
        amount: 1980,
        currency: 'JPY' as const,
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: undefined,
        paymentCycle: 'MONTHLY' as const,
        exchangeRate: undefined,
        createdAt: '2025-01-01T10:00:00.000Z',
        updatedAt: '2025-01-01T10:00:00.000Z',
      }

      mockSubscriptionRepo.create.mockResolvedValue(mockSubscription)

      const requestBody = {
        serviceName: 'Netflix',
        amount: 1980,
        currency: 'JPY',
        startDate: '2025-01-01',
        endDate: undefined,
        paymentCycle: 'MONTHLY',
      }

      const request = new NextRequest('http://localhost:3000/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result).toEqual(mockSubscription)
      expect(mockSubscriptionRepo.create).toHaveBeenCalledWith({
        serviceName: 'Netflix',
        amount: 1980,
        currency: 'JPY',
        startDate: new Date('2025-01-01'),
        endDate: undefined,
        paymentCycle: 'MONTHLY',
        exchangeRate: undefined,
      })
      expect(mockGetAverageExchangeRate).not.toHaveBeenCalled()
    })

    it('should create USD subscription with exchange rate', async () => {
      const mockSubscription = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        serviceName: 'Spotify',
        amount: 9.99,
        currency: 'USD' as const,
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: undefined,
        paymentCycle: 'MONTHLY' as const,
        exchangeRate: 150.5,
        createdAt: '2025-01-01T10:00:00.000Z',
        updatedAt: '2025-01-01T10:00:00.000Z',
      }

      mockSubscriptionRepo.create.mockResolvedValue(mockSubscription)
      mockGetAverageExchangeRate.mockResolvedValue(150.5)

      const requestBody = {
        serviceName: 'Spotify',
        amount: 9.99,
        currency: 'USD',
        startDate: '2025-01-01',
        paymentCycle: 'MONTHLY',
      }

      const request = new NextRequest('http://localhost:3000/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result).toEqual(mockSubscription)
      expect(mockGetAverageExchangeRate).toHaveBeenCalledWith(new Date('2025-01-01'))
      expect(mockSubscriptionRepo.create).toHaveBeenCalledWith({
        serviceName: 'Spotify',
        amount: 9.99,
        currency: 'USD',
        startDate: new Date('2025-01-01'),
        endDate: undefined,
        paymentCycle: 'MONTHLY',
        exchangeRate: 150.5,
      })
    })

    it('should handle validation errors', async () => {
      const requestBody = {
        serviceName: '', // Invalid: empty string
        amount: -100, // Invalid: negative number
        currency: 'INVALID', // Invalid: not JPY or USD
        startDate: '2025-01-01',
        paymentCycle: 'MONTHLY',
      }

      const request = new NextRequest('http://localhost:3000/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('バリデーションエラー')
      expect(result.details).toBeDefined()
      expect(mockSubscriptionRepo.create).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      mockSubscriptionRepo.create.mockRejectedValue(new Error('Database connection failed'))

      const requestBody = {
        serviceName: 'Netflix',
        amount: 1980,
        currency: 'JPY',
        startDate: '2025-01-01',
        paymentCycle: 'MONTHLY',
      }

      const request = new NextRequest('http://localhost:3000/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('サブスクリプションの作成に失敗しました')
    })

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/subscriptions', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('サブスクリプションの作成に失敗しました')
    })
  })

  describe('GET /api/subscriptions', () => {
    it('should return all subscriptions successfully', async () => {
      const mockSubscriptions = [
        {
          id: '1',
          serviceName: 'Netflix',
          amount: 1980,
          currency: 'JPY' as const,
          startDate: '2025-01-01T00:00:00.000Z',
          endDate: undefined,
          paymentCycle: 'MONTHLY' as const,
          exchangeRate: undefined,
          createdAt: '2025-01-01T10:00:00.000Z',
          updatedAt: '2025-01-01T10:00:00.000Z',
        },
        {
          id: '2',
          serviceName: 'Spotify',
          amount: 9.99,
          currency: 'USD' as const,
          startDate: '2025-01-01T00:00:00.000Z',
          endDate: undefined,
          paymentCycle: 'MONTHLY' as const,
          exchangeRate: 150.5,
          createdAt: '2025-01-01T10:00:00.000Z',
          updatedAt: '2025-01-01T10:00:00.000Z',
        },
      ]

      mockSubscriptionRepo.findAll.mockResolvedValue(mockSubscriptions)

      const response = await GET()
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result).toEqual(mockSubscriptions)
      expect(mockSubscriptionRepo.findAll).toHaveBeenCalledTimes(1)
    })

    it('should return empty array when no subscriptions exist', async () => {
      mockSubscriptionRepo.findAll.mockResolvedValue([])

      const response = await GET()
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result).toEqual([])
    })

    it('should handle database errors', async () => {
      mockSubscriptionRepo.findAll.mockRejectedValue(new Error('Database connection failed'))

      const response = await GET()
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('サブスクリプションの取得に失敗しました')
    })
  })
})