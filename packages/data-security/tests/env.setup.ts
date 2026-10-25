// Runs before every test file: FAKE configuration only.
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://placeholder/unused'; // replaced by mongodb-memory-server in integration tests
process.env.JWT_SECRET = 'unit-test-secret-unit-test-secret-0123456789';
process.env.BCRYPT_COST = '4';
process.env.AUDIT_HASH_CHAIN = 'on';
process.env.LOGIN_RATE_MAX = '1000';
