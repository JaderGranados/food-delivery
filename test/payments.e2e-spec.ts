import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('Payments (e2e)', () => {
  let app: INestApplication<App>;
  let orderId: string;

  const http = () => request(app.getHttpServer());

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const restaurant = await http()
      .post('/restaurants')
      .send({
        name: 'Soda Tica',
        openingHours: [{ day: 'monday', open: '09:00', close: '22:00' }],
      })
      .expect(201);
    const item = await http()
      .post(`/restaurants/${restaurant.body.id}/menu-items`)
      .send({ name: 'Casado', price: { amount: 350000, currency: 'CRC' } })
      .expect(201);
    const order = await http()
      .post('/orders')
      .send({
        customerId: 'c-1',
        restaurantId: restaurant.body.id,
        items: [{ menuItemId: item.body.id, quantity: 2 }],
      })
      .expect(201);
    orderId = order.body.id;
  });

  afterEach(async () => {
    await app.close();
  });

  const authorize = () =>
    http().post('/payments').send({ orderId, paymentToken: 'tok_ok' });

  describe('POST /payments', () => {
    it('authorizes the order total taken from Ordering', async () => {
      const res = await authorize().expect(201);

      expect(res.body).toEqual({
        id: expect.any(String),
        orderId,
        status: 'authorized',
        amount: { amount: 700000, currency: 'CRC' },
        refunded: { amount: 0, currency: 'CRC' },
        createdAt: expect.any(String),
      });
    });

    it('does not accept an amount from the client', async () => {
      await http()
        .post('/payments')
        .send({ orderId, paymentToken: 'tok_ok', amount: 1 })
        .expect(400);
    });

    it('returns 404 for an unknown order', async () => {
      await http()
        .post('/payments')
        .send({ orderId: 'unknown', paymentToken: 'tok_ok' })
        .expect(404);
    });

    it('returns 409 for a cancelled order', async () => {
      await http().post(`/orders/${orderId}/cancel`).expect(200);

      await authorize().expect(409);
    });

    it('returns 409 when the order already has a payment', async () => {
      await authorize().expect(201);

      await authorize().expect(409);
    });

    it('returns 409 when the gateway declines and allows a retry', async () => {
      await http()
        .post('/payments')
        .send({ orderId, paymentToken: 'tok_declined' })
        .expect(409);

      await authorize().expect(201);
    });

    it.each([
      ['a missing token', { orderId: 'o-1' }],
      ['a missing order', { paymentToken: 'tok_ok' }],
      ['an empty token', { orderId: 'o-1', paymentToken: '' }],
    ])('returns 400 for %s', async (_case, body) => {
      await http().post('/payments').send(body).expect(400);
    });
  });

  describe('capture and refund', () => {
    let paymentId: string;

    beforeEach(async () => {
      const res = await authorize().expect(201);
      paymentId = res.body.id;
    });

    it('captures a payment', async () => {
      const res = await http()
        .post(`/payments/${paymentId}/capture`)
        .expect(200);

      expect(res.body.status).toBe('captured');
    });

    it('returns 409 when capturing twice', async () => {
      await http().post(`/payments/${paymentId}/capture`).expect(200);

      await http().post(`/payments/${paymentId}/capture`).expect(409);
    });

    it('returns 409 when refunding before capture', async () => {
      await http().post(`/payments/${paymentId}/refund`).send({}).expect(409);
    });

    it('refunds partially and then the rest', async () => {
      await http().post(`/payments/${paymentId}/capture`).expect(200);

      const partial = await http()
        .post(`/payments/${paymentId}/refund`)
        .send({ amount: 200000 })
        .expect(200);
      const rest = await http()
        .post(`/payments/${paymentId}/refund`)
        .send({})
        .expect(200);

      expect(partial.body).toMatchObject({
        status: 'partially_refunded',
        refunded: { amount: 200000, currency: 'CRC' },
      });
      expect(rest.body).toMatchObject({
        status: 'refunded',
        refunded: { amount: 700000, currency: 'CRC' },
      });
    });

    it('returns 409 when refunding more than was paid', async () => {
      await http().post(`/payments/${paymentId}/capture`).expect(200);

      await http()
        .post(`/payments/${paymentId}/refund`)
        .send({ amount: 700001 })
        .expect(409);
    });

    it.each([
      ['a zero amount', { amount: 0 }],
      ['a negative amount', { amount: -5 }],
      ['a fractional amount', { amount: 1.5 }],
      ['an unknown field', { reason: 'because' }],
    ])('returns 400 when refunding with %s', async (_case, body) => {
      await http().post(`/payments/${paymentId}/capture`).expect(200);

      await http().post(`/payments/${paymentId}/refund`).send(body).expect(400);
    });

    it.each(['capture', 'refund'])(
      'returns 404 on %s for an unknown payment',
      async (action) => {
        await http().post(`/payments/unknown/${action}`).send({}).expect(404);
      },
    );
  });

  describe('GET /payments/:id', () => {
    it('returns the payment', async () => {
      const created = await authorize().expect(201);

      const res = await http().get(`/payments/${created.body.id}`).expect(200);

      expect(res.body).toEqual(created.body);
    });

    it('returns 404 for an unknown payment', async () => {
      await http().get('/payments/unknown').expect(404);
    });
  });
});
