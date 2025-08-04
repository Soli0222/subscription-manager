// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Mock environment variables for testing
process.env.EXCHANGE_RATE_API_URL = 'https://api.exchangerate-api.com/v4/latest/USD'
process.env.POSTGRES_USER = 'test_user'
process.env.POSTGRES_PASSWORD = 'test_password'
process.env.POSTGRES_DB = 'test_db'
process.env.POSTGRES_HOST = 'localhost'
process.env.POSTGRES_PORT = '5432'