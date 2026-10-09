import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('POST /customers/signup (e2e)', () => {
  let app: INestApplication<App>;

  const validBody = {
    name: 'Ana',
    email: 'Ana@Example.com',
    password: 'supersecret',
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('creates a customer and never returns the password', async () => {
    const res = await request(app.getHttpServer())
      .post('/customers/signup')
      .send(validBody)
      .expect(201);

    expect(res.body).toEqual({
      id: expect.any(String),
      name: 'Ana',
      email: 'ana@example.com',
      createdAt: expect.any(String),
    });
  });

  it('returns 409 when the email is already registered', async () => {
    await request(app.getHttpServer())
      .post('/customers/signup')
      .send(validBody)
      .expect(201);

    await request(app.getHttpServer())
      .post('/customers/signup')
      .send({ ...validBody, email: 'ana@example.com' })
      .expect(409);
  });

  it.each([
    ['an invalid email', { ...validBody, email: 'not-an-email' }],
    ['a short password', { ...validBody, password: 'short' }],
    [
      'a missing name',
      { email: validBody.email, password: validBody.password },
    ],
    ['an unknown field', { ...validBody, role: 'admin' }],
  ])('returns 400 for %s', async (_case, body) => {
    await request(app.getHttpServer())
      .post('/customers/signup')
      .send(body)
      .expect(400);
  });
});
