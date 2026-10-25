import { hashPassword } from '../packages/data-security/src/security/password';

export const DEMO_CREDENTIALS = [
  { email: 'user1@brandguard.test', role: 'admin', workspace: 'alpha' },
  { email: 'user2@brandguard.test', role: 'creator', workspace: 'alpha' },
  { email: 'user3@brandguard.test', role: 'reviewer', workspace: 'alpha' },
  { email: 'user4@brandguard.test', role: 'reviewer', workspace: 'beta' },
];

console.log('--- BrandGuard Demo User Profiles ---');
DEMO_CREDENTIALS.forEach((c) => {
  console.log(`- ${c.email} (Role: ${c.role}, Workspace: ${c.workspace})`);
});
