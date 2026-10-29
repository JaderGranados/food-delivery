import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('Orders (e2e)', () => {
  let app: INestApplication<App>;
  let restaurantId: string;
  let casadoId: string;
  let galloId: string;

  const http = () => request(app.getHttpServer());

  const placeBody = () => ({
    customerId: 'c-1',
    restaurantId,
    items: [{ menuItemId: casadoId, quantity: 2 }],
  });

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
    restaurantId = restaurant.body.id;

    const casado = await http()
      .post(`/restaurants/${restaurantId}/menu-items`)
      .send({ name: 'Casado', price: { amount: 350000, currency: 'CRC' } })
      .expect(201);
    casadoId = casado.body.id;

    const gallo = await http()
      .post(`/restaurants/${restaurantId}/menu-items`)
      .send({ name: 'Gallo pinto', price: { amount: 200000, currency: 'CRC' } })
      .expect(201);
    galloId = gallo.body.id;
    await http()
      .patch(`/restaurants/${restaurantId}/menu-items/${galloId}/availability`)
      .send({ available: false })
      .expect(200);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /orders', () => {
    it('places an order with the catalog prices', async () => {
      const res = await http().post('/orders').send(placeBody()).expect(201);

      expect(res.body).toEqual({
        id: expect.any(String),
        customerId: 'c-1',
        restaurantId,
        status: 'placed',
        items: [
          {
            menuItemId: casadoId,
            name: 'Casado',
            unitPrice: { amount: 350000, currency: 'CRC' },
            quantity: 2,
            lineTotal: { amount: 700000, currency: 'CRC' },
          },
        ],
        total: { amount: 700000, currency: 'CRC' },
        createdAt: expect.any(String),
      });
    });

    it('keeps the price it was placed with', async () => {
      const placed = await http().post('/orders').send(placeBody()).expect(201);

      const res = await http().get(`/orders/${placed.body.id}`).expect(200);

      expect(res.body.total).toEqual({ amount: 700000, currency: 'CRC' });
    });

    it('returns 404 for an unknown restaurant', async () => {
      await http()
        .post('/orders')
        .send({ ...placeBody(), restaurantId: 'unknown' })
        .expect(404);
    });

    it('returns 404 for an unknown menu item', async () => {
      await http()
        .post('/orders')
        .send({
          ...placeBody(),
          items: [{ menuItemId: 'unknown', quantity: 1 }],
        })
        .expect(404);
    });

    it('returns 409 for an unavailable menu item', async () => {
      await http()
        .post('/orders')
        .send({ ...placeBody(), items: [{ menuItemId: galloId, quantity: 1 }] })
        .expect(409);
    });

    it.each([
      ['a missing customer', { customerId: undefined }],
      ['no items', { items: [] }],
      ['a zero quantity', { items: [{ menuItemId: 'x', quantity: 0 }] }],
      [
        'a fractional quantity',
        { items: [{ menuItemId: 'x', quantity: 1.5 }] },
      ],
      ['a too large quantity', { items: [{ menuItemId: 'x', quantity: 100 }] }],
      ['an unknown field', { total: 1 }],
    ])('returns 400 for %s', async (_case, override) => {
      await http()
        .post('/orders')
        .send({ ...placeBody(), ...override })
        .expect(400);
    });

    it('returns 400 when the same item is listed twice', async () => {
      await http()
        .post('/orders')
        .send({
          ...placeBody(),
          items: [
            { menuItemId: casadoId, quantity: 1 },
            { menuItemId: casadoId, quantity: 1 },
          ],
        })
        .expect(400);
    });
  });

  describe('lifecycle', () => {
    let orderId: string;

    beforeEach(async () => {
      const res = await http().post('/orders').send(placeBody()).expect(201);
      orderId = res.body.id;
    });

    it('confirms an order', async () => {
      const res = await http().post(`/orders/${orderId}/confirm`).expect(200);

      expect(res.body.status).toBe('confirmed');
    });

    it('cancels an order', async () => {
      const res = await http().post(`/orders/${orderId}/cancel`).expect(200);

      expect(res.body.status).toBe('cancelled');
    });

    it('returns 409 when confirming a cancelled order', async () => {
      await http().post(`/orders/${orderId}/cancel`).expect(200);

      await http().post(`/orders/${orderId}/confirm`).expect(409);
    });

    it('returns 409 when cancelling twice', async () => {
      await http().post(`/orders/${orderId}/cancel`).expect(200);

      await http().post(`/orders/${orderId}/cancel`).expect(409);
    });

    it.each(['confirm', 'cancel'])(
      'returns 404 on %s for an unknown order',
      async (action) => {
        await http().post(`/orders/unknown/${action}`).expect(404);
      },
    );
  });

  describe('GET /orders/:id', () => {
    it('returns 404 for an unknown order', async () => {
      await http().get('/orders/unknown').expect(404);
    });
  });
});
