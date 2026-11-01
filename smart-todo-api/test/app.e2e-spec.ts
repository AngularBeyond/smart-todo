import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/health returns wrapped { success: true, data: { status: "ok" } }', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        status: 'ok',
      },
    });
  });

  it('POST /api/v1/test-validation rejects non-whitelisted properties with 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/test-validation')
      .send({
        title: 'Valid title',
        extraField: 'Malicious or non-whitelisted payload',
      })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 400,
    });
    expect(JSON.stringify(response.body.message)).toContain('property extraField should not exist');
  });

  it('GET /api/v1/test-throttle returns 429 when rate limit is exceeded', async () => {
    // limit is 2
    await request(app.getHttpServer()).get('/api/v1/test-throttle').expect(200);
    await request(app.getHttpServer()).get('/api/v1/test-throttle').expect(200);

    const response = await request(app.getHttpServer())
      .get('/api/v1/test-throttle')
      .expect(429);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 429,
    });
  });

  describe('Auth Registration (e2e)', () => {
    const uniqueEmail = `test_${Date.now()}@example.com`;

    it('POST /api/v1/auth/register creates user, default list, 5 todos and returns tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Onboarding',
          lastName: 'Tester',
          email: uniqueEmail,
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          accessToken: expect.any(String),
          user: {
            id: expect.any(String),
            name: 'Onboarding',
            lastName: 'Tester',
            email: uniqueEmail,
            preferredTheme: 'light',
          },
        },
      });

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const hasRefreshTokenCookie = cookies?.some((cookie: string) =>
        cookie.includes('refresh_token'),
      );
      expect(hasRefreshTokenCookie).toBe(true);
    });

    it('POST /api/v1/auth/register rejects duplicate email with 409 Conflict', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Duplicate',
          lastName: 'Tester',
          email: uniqueEmail,
          password: 'password123',
        })
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        statusCode: 409,
        message: 'An account with this email already exists.',
      });
    });

    it('POST /api/v1/auth/login logs in user and returns tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: uniqueEmail,
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          accessToken: expect.any(String),
          user: {
            email: uniqueEmail,
          },
        },
      });

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
    });

    it('POST /api/v1/auth/login with wrong password returns 401 Unauthorized', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: uniqueEmail,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        statusCode: 401,
        message: 'Invalid email or password.',
      });
    });

    it('GET /api/v1/auth/authenticated requires valid Bearer token', async () => {
      // 401 without token
      await request(app.getHttpServer())
        .get('/api/v1/auth/authenticated')
        .expect(401);

      // Login to get token
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: uniqueEmail,
          password: 'password123',
        })
        .expect(201);

      const token = loginRes.body.data.accessToken;

      // 200 with token
      const authRes = await request(app.getHttpServer())
        .get('/api/v1/auth/authenticated')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(authRes.body).toMatchObject({
        success: true,
        data: {
          authenticated: true,
        },
      });
    });

    it('POST /api/v1/auth/refresh rotates refresh token and returns new access token', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: uniqueEmail,
          password: 'password123',
        })
        .expect(201);

      const cookies = loginRes.headers['set-cookie'] as unknown as string[];
      const refreshCookie = cookies?.find((c: string) => c.startsWith('refresh_token='));
      expect(refreshCookie).toBeDefined();

      const refreshRes = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', [refreshCookie!])
        .expect(201);

      expect(refreshRes.body).toMatchObject({
        success: true,
        data: {
          accessToken: expect.any(String),
        },
      });

      const newCookies = refreshRes.headers['set-cookie'] as unknown as string[];
      expect(newCookies?.some((c: string) => c.startsWith('refresh_token='))).toBe(true);
    });

    it('PATCH /api/v1/auth/change-password rejects incorrect current password with 400', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: uniqueEmail,
          password: 'password123',
        })
        .expect(201);

      const token = loginRes.body.data.accessToken;

      const response = await request(app.getHttpServer())
        .patch('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'wrong-current-password',
          newPassword: 'newsecurepassword',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        statusCode: 400,
        message: 'Current password is incorrect.',
      });
    });

    it('PATCH /api/v1/auth/change-password updates password and allows login with new password', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: uniqueEmail,
          password: 'password123',
        })
        .expect(201);

      const token = loginRes.body.data.accessToken;

      const changeRes = await request(app.getHttpServer())
        .patch('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'updatedpassword123',
        })
        .expect(200);

      expect(changeRes.body).toMatchObject({
        success: true,
        data: {
          accessToken: expect.any(String),
        },
      });

      // Login with old password fails
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: uniqueEmail,
          password: 'password123',
        })
        .expect(401);

      // Login with new password succeeds
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: uniqueEmail,
          password: 'updatedpassword123',
        })
        .expect(201);
    });

    it('POST /api/v1/auth/logout clears refresh cookie and revokes token', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: uniqueEmail,
          password: 'updatedpassword123',
        })
        .expect(201);

      const token = loginRes.body.data.accessToken;
      const cookies = loginRes.headers['set-cookie'] as unknown as string[];
      const refreshCookie = cookies?.find((c: string) => c.startsWith('refresh_token='));

      const logoutRes = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .set('Cookie', [refreshCookie!])
        .expect(201);

      expect(logoutRes.body).toMatchObject({
        success: true,
        data: {
          success: true,
        },
      });

      // Old refresh token is revoked
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', [refreshCookie!])
        .expect(401);
    });
  });
});
