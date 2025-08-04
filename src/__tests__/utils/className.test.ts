import { cn } from '@/lib/utils'

describe('Utility Functions', () => {
  describe('cn (className merger)', () => {
    it('should merge basic class names', () => {
      const result = cn('bg-red-500', 'text-white')
      expect(result).toBe('bg-red-500 text-white')
    })

    it('should handle conditional classes', () => {
      const result = cn('base-class', false && 'conditional-class', 'always-applied')
      expect(result).toBe('base-class always-applied')
    })

    it('should handle overlapping Tailwind classes', () => {
      // twMerge should handle conflicting classes
      const result = cn('px-2', 'px-4')
      expect(result).toBe('px-4') // Later px-4 should override px-2
    })

    it('should handle undefined and null values', () => {
      const result = cn('base-class', undefined, null, 'end-class')
      expect(result).toBe('base-class end-class')
    })

    it('should handle empty string and whitespace', () => {
      const result = cn('base-class', '', '  ', 'end-class')
      expect(result).toBe('base-class end-class')
    })

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3')
      expect(result).toBe('class1 class2 class3')
    })

    it('should handle objects with boolean values', () => {
      const result = cn({
        'always-true': true,
        'always-false': false,
        'conditionally-true': 1 > 0
      })
      expect(result).toBe('always-true conditionally-true')
    })

    it('should handle complex mixed inputs', () => {
      const isActive = true
      const size = 'large'
      
      const result = cn(
        'base-component',
        {
          'active': isActive,
          'inactive': !isActive,
          'large': size === 'large',
          'small': size === 'small'
        },
        isActive && 'state-active',
        `size-${size}`
      )
      
      expect(result).toBe('base-component active large state-active size-large')
    })
  })
})