import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('POST /customers/:id/add-address (e2e)', () => {
  let app: INestApplication<App>;
  let customerId: string;

  const validBody = {
    street: 'Calle 123',
    city: 'San José',
    state: 'San José',
    postalCode: '10101',
    country: 'CR',
    reference: 'Casa azul',
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const res = await request(app.getHttpServer())
      .post('/customers/signup')
      .send({ name: 'Ana', email: 'ana@example.com', password: 'supersecret' })
      .expect(201);
    customerId = res.body.id;
  });

  afterEach(async () => {
    await app.close();
  });

  it('adds an address and returns it with an id', async () => {
    const res = await request(app.getHttpServer())
      .post(`/customers/${customerId}/add-address`)
      .send(validBody)
      .expect(201);

    expect(res.body).toEqual({ id: expect.any(String), ...validBody });
  });

  it('accepts an address without reference', async () => {
    const { reference: _reference, ...body } = validBody;
    await request(app.getHttpServer())
      .post(`/customers/${customerId}/add-address`)
      .send(body)
      .expect(201);
  });

  it('returns 404 when the customer does not exist', async () => {
    await request(app.getHttpServer())
      .post('/customers/unknown-id/add-address')
      .send(validBody)
      .expect(404);
  });

  it.each([
    ['a missing street', { ...validBody, street: undefined }],
    ['an empty city', { ...validBody, city: '' }],
    ['an unknown field', { ...validBody, role: 'admin' }],
    ['an invalid postal code', { ...validBody, postalCode: '!!' }],
    ['a too long street', { ...validBody, street: 'a'.repeat(201) }],
  ])('returns 400 for %s', async (_case, body) => {
    await request(app.getHttpServer())
      .post(`/customers/${customerId}/add-address`)
      .send(body)
      .expect(400);
  });
});
