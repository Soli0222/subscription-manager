import { convertToJpy } from '@/lib/exchange-rate'

describe('Exchange Rate Utility Functions', () => {
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

    it('should handle decimal amounts correctly', () => {
      const amount = 99.99
      const exchangeRate = 150
      const result = convertToJpy(amount, 'USD', exchangeRate)
      
      expect(result).toBe(14999) // Math.round(99.99 * 150) = 14999
    })

    it('should handle small amounts', () => {
      const amount = 0.01
      const exchangeRate = 150
      const result = convertToJpy(amount, 'USD', exchangeRate)
      
      expect(result).toBe(2) // Math.round(0.01 * 150) = 2
    })

    it('should handle large amounts', () => {
      const amount = 10000
      const exchangeRate = 149.99
      const result = convertToJpy(amount, 'USD', exchangeRate)
      
      expect(result).toBe(1499900) // Math.round(10000 * 149.99) = 1499900
    })
  })
})