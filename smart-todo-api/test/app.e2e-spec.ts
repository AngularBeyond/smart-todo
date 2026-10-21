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
});
