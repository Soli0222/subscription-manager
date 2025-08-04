import { convertToJpy, getCurrentExchangeRate, getAverageExchangeRate } from '@/lib/exchange-rate'
import { subDays } from 'date-fns'

// Mock the repository
jest.mock('@/lib/repository', () => ({
  ExchangeRateRepository: jest.fn().mockImplementation(() => ({
    findLatest: jest.fn(),
    create: jest.fn(),
    findByDateRange: jest.fn(),
  })),
}))

// Mock fetch for external API calls
global.fetch = jest.fn()

import { ExchangeRateRepository } from '@/lib/repository'

describe('Exchange Rate Utilities', () => {
  let mockExchangeRateRepo: jest.Mocked<ExchangeRateRepository>

  beforeEach(() => {
    jest.clearAllMocks()
    mockExchangeRateRepo = new ExchangeRateRepository() as jest.Mocked<ExchangeRateRepository>
    
    // Reset environment variables
    process.env.EXCHANGE_RATE_API_URL = 'https://api.exchangerate-api.com/v4/latest/USD'
  })

  describe('convertToJpy', () => {
    it('should return the same amount for JPY currency', () => {
      const amount = 1000
      const result = convertToJpy(amount, 'JPY')
      
      expect(result).toBe(1000)
    })

    it('should convert USD to JPY using provided exchange rate', () => {
      const amount = 100
      const exchangeRate = 150
      const result = convertToJpy(amount, 'USD', exchangeRate)
      
      expect(result).toBe(15000) // 100 * 150 = 15000
    })

    it('should convert USD to JPY with decimal exchange rate', () => {
      const amount = 50
      const exchangeRate = 149.75
      const result = convertToJpy(amount, 'USD', exchangeRate)
      
      expect(result).toBe(7488) // Math.round(50 * 149.75) = 7488
    })

    it('should use fallback rate when USD exchange rate is not provided', () => {
      const amount = 100
      const result = convertToJpy(amount, 'USD')
      
      expect(result).toBe(15000) // 100 * 150 (fallback rate)
    })

    it('should use fallback rate when USD exchange rate is undefined', () => {
      const amount = 100
      const result = convertToJpy(amount, 'USD', undefined)
      
      expect(result).toBe(15000) // 100 * 150 (fallback rate)
    })

    it('should handle zero amount', () => {
      const result = convertToJpy(0, 'USD', 150)
      
      expect(result).toBe(0)
    })

    it('should handle decimal amounts', () => {
      const amount = 99.99
      const exchangeRate = 150
      const result = convertToJpy(amount, 'USD', exchangeRate)
      
      expect(result).toBe(14999) // Math.round(99.99 * 150) = 14999
    })
  })

  describe('getCurrentExchangeRate', () => {
    it('should return latest rate if it is within 24 hours', async () => {
      const mockRate = {
        id: '1',
        date: new Date(), // Current date (within 24 hours)
        usdToJpy: 148.5,
        createdAt: new Date(),
      }
      
      mockExchangeRateRepo.findLatest.mockResolvedValue(mockRate)
      
      const result = await getCurrentExchangeRate()
      
      expect(result).toBe(148.5)
      expect(mockExchangeRateRepo.findLatest).toHaveBeenCalledTimes(1)
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should fetch new rate if latest rate is older than 24 hours', async () => {
      const oldRate = {
        id: '1',
        date: subDays(new Date(), 2), // 2 days old
        usdToJpy: 148.5,
        createdAt: new Date(),
      }
      
      mockExchangeRateRepo.findLatest.mockResolvedValue(oldRate)
      mockExchangeRateRepo.create.mockResolvedValue({
        id: '2',
        date: new Date(),
        usdToJpy: 151.2,
        createdAt: new Date(),
      })
      
      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        json: () => Promise.resolve({ rates: { JPY: 151.2 } }),
      } as Response)
      
      const result = await getCurrentExchangeRate()
      
      expect(result).toBe(151.2)
      expect(fetch).toHaveBeenCalledWith('https://api.exchangerate-api.com/v4/latest/USD')
      expect(mockExchangeRateRepo.create).toHaveBeenCalledWith(expect.any(Date), 151.2)
    })

    it('should fetch new rate if no latest rate exists', async () => {
      mockExchangeRateRepo.findLatest.mockResolvedValue(null)
      mockExchangeRateRepo.create.mockResolvedValue({
        id: '1',
        date: new Date(),
        usdToJpy: 149.8,
        createdAt: new Date(),
      })
      
      ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        json: () => Promise.resolve({ rates: { JPY: 149.8 } }),
      } as Response)
      
      const result = await getCurrentExchangeRate()
      
      expect(result).toBe(149.8)
      expect(fetch).toHaveBeenCalledWith('https://api.exchangerate-api.com/v4/latest/USD')
      expect(mockExchangeRateRepo.create).toHaveBeenCalledWith(expect.any(Date), 149.8)
    })

    it('should return fallback rate on API error', async () => {
      mockExchangeRateRepo.findLatest.mockResolvedValue(null)
      ;(fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(new Error('API Error'))
      
      const result = await getCurrentExchangeRate()
      
      expect(result).toBe(150) // Fallback rate
    })
  })

  describe('getAverageExchangeRate', () => {
    it('should calculate average from historical rates', async () => {
      const fromDate = new Date('2025-01-15')
      const mockRates = [
        { id: '1', date: new Date('2025-01-10'), usdToJpy: 148.0, createdAt: new Date() },
        { id: '2', date: new Date('2025-01-12'), usdToJpy: 150.0, createdAt: new Date() },
        { id: '3', date: new Date('2025-01-14'), usdToJpy: 152.0, createdAt: new Date() },
      ]
      
      mockExchangeRateRepo.findByDateRange.mockResolvedValue(mockRates)
      
      const result = await getAverageExchangeRate(fromDate)
      
      expect(result).toBe(150) // (148 + 150 + 152) / 3 = 150
      expect(mockExchangeRateRepo.findByDateRange).toHaveBeenCalledWith(
        subDays(fromDate, 30),
        fromDate
      )
    })

    it('should use custom days parameter', async () => {
      const fromDate = new Date('2025-01-15')
      const days = 7
      
      mockExchangeRateRepo.findByDateRange.mockResolvedValue([
        { id: '1', date: new Date('2025-01-10'), usdToJpy: 149.5, createdAt: new Date() },
      ])
      
      await getAverageExchangeRate(fromDate, days)
      
      expect(mockExchangeRateRepo.findByDateRange).toHaveBeenCalledWith(
        subDays(fromDate, 7),
        fromDate
      )
    })

    it('should return current rate if no historical data exists', async () => {
      const fromDate = new Date('2025-01-15')
      
      mockExchangeRateRepo.findByDateRange.mockResolvedValue([])
      mockExchangeRateRepo.findLatest.mockResolvedValue({
        id: '1',
        date: new Date(),
        usdToJpy: 148.5,
        createdAt: new Date(),
      })
      
      const result = await getAverageExchangeRate(fromDate)
      
      expect(result).toBe(148.5)
    })

    it('should return fallback rate on error', async () => {
      const fromDate = new Date('2025-01-15')
      
      mockExchangeRateRepo.findByDateRange.mockRejectedValue(new Error('Database error'))
      
      const result = await getAverageExchangeRate(fromDate)
      
      expect(result).toBe(150) // Fallback rate
    })
  })
})