import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('Reviews (e2e)', () => {
  let app: INestApplication<App>;
  let restaurantId: string;
  let itemId: string;
  let courierId: string;

  const http = () => request(app.getHttpServer());
  const at = { latitude: 9.93, longitude: -84.08 };

  /** Places and confirms an order; optionally takes it all the way to delivered. */
  async function order(customerId: string, deliver: boolean): Promise<string> {
    const placed = await http()
      .post('/orders')
      .send({
        customerId,
        restaurantId,
        items: [{ menuItemId: itemId, quantity: 1 }],
      })
      .expect(201);
    const orderId = placed.body.id;
    await http().post(`/orders/${orderId}/confirm`).expect(200);

    if (deliver) {
      const delivery = await http()
        .post('/deliveries')
        .send({ orderId, pickup: at, dropoff: at })
        .expect(201);
      await http().post(`/deliveries/${delivery.body.id}/dispatch`).expect(200);
      await http().post(`/deliveries/${delivery.body.id}/pick-up`).expect(200);
      await http().post(`/deliveries/${delivery.body.id}/complete`).expect(200);
    }
    return orderId;
  }

  const review = (orderId: string, overrides: object = {}) =>
    http()
      .post('/reviews')
      .send({
        orderId,
        customerId: 'c-1',
        targetType: 'restaurant',
        stars: 5,
        comment: 'Delicious',
        ...overrides,
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
    const item = await http()
      .post(`/restaurants/${restaurantId}/menu-items`)
      .send({ name: 'Casado', price: { amount: 350000, currency: 'CRC' } })
      .expect(201);
    itemId = item.body.id;

    const courier = await http()
      .post('/couriers')
      .send({ name: 'Luis' })
      .expect(201);
    courierId = courier.body.id;
    await http()
      .patch(`/couriers/${courierId}/availability`)
      .send({ available: true, location: at })
      .expect(200);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /reviews', () => {
    it('reviews the restaurant of a delivered order', async () => {
      const orderId = await order('c-1', true);

      const res = await review(orderId).expect(201);

      expect(res.body).toEqual({
        id: expect.any(String),
        orderId,
        customerId: 'c-1',
        target: { type: 'restaurant', id: restaurantId },
        stars: 5,
        comment: 'Delicious',
        createdAt: expect.any(String),
      });
    });

    it('reviews the courier who delivered the order', async () => {
      const orderId = await order('c-1', true);

      const res = await review(orderId, {
        targetType: 'courier',
        stars: 4,
      }).expect(201);

      expect(res.body.target).toEqual({ type: 'courier', id: courierId });
    });

    it('accepts a review without a comment', async () => {
      const orderId = await order('c-1', true);

      await review(orderId, { comment: undefined }).expect(201);
    });

    it('returns 409 for a second review of the same kind', async () => {
      const orderId = await order('c-1', true);
      await review(orderId).expect(201);

      await review(orderId, { stars: 1 }).expect(409);
    });

    it('returns 404 for an unknown order', async () => {
      await review('unknown').expect(404);
    });

    it('returns 403 when the customer did not place the order', async () => {
      const orderId = await order('c-1', true);

      await review(orderId, { customerId: 'someone-else' }).expect(403);
    });

    it('returns 409 when the order has no delivery yet', async () => {
      const orderId = await order('c-1', false);

      await review(orderId).expect(409);
    });

    it('returns 409 when the delivery is not finished', async () => {
      const orderId = await order('c-1', false);
      const delivery = await http()
        .post('/deliveries')
        .send({ orderId, pickup: at, dropoff: at })
        .expect(201);
      await http().post(`/deliveries/${delivery.body.id}/dispatch`).expect(200);

      await review(orderId).expect(409);
    });

    it.each([
      ['zero stars', { stars: 0 }],
      ['six stars', { stars: 6 }],
      ['fractional stars', { stars: 3.5 }],
      ['a missing customer', { customerId: undefined }],
      ['an unknown target type', { targetType: 'customer' }],
      ['a too long comment', { comment: 'a'.repeat(501) }],
      ['an unknown field', { verified: true }],
    ])('returns 400 for %s', async (_case, overrides) => {
      const orderId = await order('c-1', true);

      await review(orderId, overrides).expect(400);
    });
  });

  describe('listing and summary', () => {
    beforeEach(async () => {
      const first = await order('c-1', true);
      const second = await order('c-2', true);
      const third = await order('c-3', true);
      await review(first, { stars: 5 }).expect(201);
      await review(second, { customerId: 'c-2', stars: 4 }).expect(201);
      await review(third, {
        customerId: 'c-3',
        stars: 4,
        targetType: 'courier',
      }).expect(201);
    });

    it('lists the reviews of the restaurant, newest first', async () => {
      const res = await http()
        .get('/reviews')
        .query({ targetType: 'restaurant', targetId: restaurantId })
        .expect(200);

      expect(res.body.map((r: { stars: number }) => r.stars)).toEqual([4, 5]);
    });

    it('summarizes the restaurant', async () => {
      const res = await http()
        .get('/reviews/summary')
        .query({ targetType: 'restaurant', targetId: restaurantId })
        .expect(200);

      expect(res.body).toEqual({
        target: { type: 'restaurant', id: restaurantId },
        count: 2,
        average: 4.5,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 },
      });
    });

    it('summarizes the courier separately', async () => {
      const res = await http()
        .get('/reviews/summary')
        .query({ targetType: 'courier', targetId: courierId })
        .expect(200);

      expect(res.body).toMatchObject({ count: 1, average: 4 });
    });

    it('has no average for a target without reviews', async () => {
      const res = await http()
        .get('/reviews/summary')
        .query({ targetType: 'restaurant', targetId: 'nobody' })
        .expect(200);

      expect(res.body).toMatchObject({ count: 0, average: null });
    });

    it.each([
      ['an unknown target type', { targetType: 'menu', targetId: 'x' }],
      ['a missing target id', { targetType: 'courier' }],
      [
        'an unknown query field',
        { targetType: 'courier', targetId: 'x', page: 2 },
      ],
    ])('returns 400 for %s', async (_case, query) => {
      await http().get('/reviews').query(query).expect(400);
      await http().get('/reviews/summary').query(query).expect(400);
    });
  });
});
