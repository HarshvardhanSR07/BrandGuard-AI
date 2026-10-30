import request from 'supertest';
import { createApp } from '../src/app';
import * as dataSecurity from '@brandguard/data-security';

describe('OAuth Authentication (Google & Microsoft)', () => {
  const app = createApp();

  beforeAll(async () => {
    dataSecurity.loadEnv();
    await dataSecurity.connectDb();
  });

  afterAll(async () => {
    await dataSecurity.disconnectDb();
  });

  describe('Validation & Error Handling', () => {
    it('rejects POST /api/auth/google with missing idToken', async () => {
      const res = await request(app).post('/api/auth/google').send({});
      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('token is required');
    });

    it('rejects POST /api/auth/google with invalid/expired token', async () => {
      const res = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'invalid.google.token' });
      expect(res.status).toBe(401);
      expect(res.body.error.message).toContain('Google authentication failed');
    });

    it('rejects POST /api/auth/microsoft with missing idToken', async () => {
      const res = await request(app).post('/api/auth/microsoft').send({});
      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('token is required');
    });

    it('rejects POST /api/auth/microsoft with malformed token', async () => {
      const res = await request(app)
        .post('/api/auth/microsoft')
        .send({ idToken: 'invalid.microsoft.token' });
      expect(res.status).toBe(401);
      expect(res.body.error.message).toContain('Malformed Microsoft identity token');
    });

    it('rejects GET /api/auth/me when unauthenticated', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('POST /api/auth/logout clears the session cookie and returns success', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const rawCookies = res.headers['set-cookie'];
      expect(rawCookies).toBeDefined();
      const cookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies as string];
      const brandguardCookie = cookies.find((c: string) => c.includes('brandguard_token='));
      expect(brandguardCookie).toBeDefined();
    });
  });

  describe('Google OAuth Registration & Safe Account Linking', () => {
    let mockVerifyGoogle: jest.SpyInstance;

    afterEach(() => {
      if (mockVerifyGoogle) mockVerifyGoogle.mockRestore();
    });

    it('creates new user on first Google login and sets HttpOnly cookie', async () => {
      const googleSub = 'google-sub-' + Date.now();
      const googleEmail = `newuser.${Date.now()}@acme.brand`;

      mockVerifyGoogle = jest.spyOn(dataSecurity.oauthVerifier, 'verifyGoogleIdToken').mockResolvedValue({
        sub: googleSub,
        email: googleEmail,
        emailVerified: true,
        name: 'Alex Rivera',
        picture: 'https://lh3.googleusercontent.com/avatar.jpg',
        provider: 'google',
      });

      const res = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'valid-mock-google-id-token' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.isNewUser).toBe(true);
      expect(res.body.user.email).toBe(googleEmail);
      expect(res.body.user.displayName).toBe('Alex Rivera');
      expect(res.body.user.avatarUrl).toBe('https://lh3.googleusercontent.com/avatar.jpg');

      // Verify HttpOnly cookie
      const rawCookies = res.headers['set-cookie'];
      expect(rawCookies).toBeDefined();
      const cookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies as string];
      const authCookie = cookies.find((c: string) => c.includes('brandguard_token='));
      expect(authCookie).toContain('HttpOnly');

      // Verify GET /api/auth/me using the cookie
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`brandguard_token=${res.body.token}`]);

      expect(meRes.status).toBe(200);
      expect(meRes.body.user.email).toBe(googleEmail);
      expect(meRes.body.user.displayName).toBe('Alex Rivera');
    });

    it('requires confirmation before merging when an existing account has the same email', async () => {
      const email = `existing.${Date.now()}@acme.brand`;
      const googleSub = 'google-conflict-' + Date.now();

      // Create an existing local account
      await dataSecurity.register('Existing User', email, 'SuperSecure123!');

      // Now attempt Google login with matching email
      mockVerifyGoogle = jest.spyOn(dataSecurity.oauthVerifier, 'verifyGoogleIdToken').mockResolvedValue({
        sub: googleSub,
        email,
        emailVerified: true,
        name: 'Existing Google',
        provider: 'google',
      });

      // Attempt 1: Without explicit linkAccount -> 409 Conflict
      const conflictRes = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'valid-token' });

      expect(conflictRes.status).toBe(409);
      expect(conflictRes.body.error.code).toBe('ACCOUNT_LINKING_REQUIRED');

      // Attempt 2: With incorrect password -> 401
      const wrongPwRes = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'valid-token', linkAccount: true, password: 'WrongPassword!' });

      expect(wrongPwRes.status).toBe(401);

      // Attempt 3: With correct password -> 200 Linked!
      const successRes = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'valid-token', linkAccount: true, password: 'SuperSecure123!' });

      expect(successRes.status).toBe(200);
      expect(successRes.body.user.email).toBe(email);
      expect(successRes.body.user.providers.some((p: any) => p.provider === 'google')).toBe(true);
    });
  });

  describe('Microsoft OAuth Registration', () => {
    let mockVerifyMicrosoft: jest.SpyInstance;

    afterEach(() => {
      if (mockVerifyMicrosoft) mockVerifyMicrosoft.mockRestore();
    });

    it('creates new user on first Microsoft login and returns profile', async () => {
      const msOid = 'ms-oid-' + Date.now();
      const msEmail = `msuser.${Date.now()}@microsoftcorp.test`;

      mockVerifyMicrosoft = jest.spyOn(dataSecurity.oauthVerifier, 'verifyMicrosoftIdToken').mockResolvedValue({
        oid: msOid,
        sub: msOid,
        tid: 'common-tenant-id',
        email: msEmail,
        name: 'Jordan Microsoft',
        provider: 'microsoft',
      });

      const res = await request(app)
        .post('/api/auth/microsoft')
        .send({ idToken: 'valid-mock-msal-id-token' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.isNewUser).toBe(true);
      expect(res.body.user.email).toBe(msEmail);
      expect(res.body.user.displayName).toBe('Jordan Microsoft');
      expect(res.body.user.primaryProvider).toBe('microsoft');
    });
  });
});
