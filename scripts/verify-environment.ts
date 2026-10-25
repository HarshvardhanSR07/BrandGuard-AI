import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
];

const optionalEnvVars = [
  'PORT',
  'NODE_ENV',
  'CORS_ORIGIN',
  'LLM_PROVIDER',
];

console.log('--- BrandGuard AI Environment Verification ---');

let missing = 0;
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required env var: ${envVar}`);
    missing++;
  } else {
    console.log(`✅ ${envVar} is set`);
  }
}

for (const envVar of optionalEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`⚠️  Optional env var ${envVar} is not set (will use default)`);
  } else {
    console.log(`✅ ${envVar} is set`);
  }
}

if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.warn('⚠️  JWT_SECRET is shorter than 32 characters. Recommend 32+ characters for high security.');
}

if (missing > 0) {
  console.error(`\nEnvironment verification failed: ${missing} missing variable(s).`);
  process.exit(1);
} else {
  console.log('\nEnvironment verification passed successfully! 🛡️');
}
