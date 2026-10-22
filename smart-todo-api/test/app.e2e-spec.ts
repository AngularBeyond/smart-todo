import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
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
    app.setGlobalPrefix('v1');
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

  it('GET /v1/health returns wrapped { success: true, data: { status: "ok" } }', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/health')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        status: 'ok',
      },
    });
  });

  it('POST /v1/test-validation rejects non-whitelisted properties with 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/test-validation')
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

  it('GET /v1/test-throttle returns 429 when rate limit is exceeded', async () => {
    // limit is 2
    await request(app.getHttpServer()).get('/v1/test-throttle').expect(200);
    await request(app.getHttpServer()).get('/v1/test-throttle').expect(200);

    const response = await request(app.getHttpServer())
      .get('/v1/test-throttle')
      .expect(429);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 429,
    });
  });

  describe('Auth Registration (e2e)', () => {
    const uniqueEmail = `test_${Date.now()}@example.com`;

    it('POST /v1/auth/register creates user, default list, 5 todos and returns tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/register')
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

    it('POST /v1/auth/register rejects duplicate email with 409 Conflict', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/register')
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
  });
});
