import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('Delivery (e2e)', () => {
  let app: INestApplication<App>;

  const http = () => request(app.getHttpServer());

  const pickup = { latitude: 9.93, longitude: -84.08 };
  const dropoff = { latitude: 9.95, longitude: -84.1 };

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

  async function confirmedOrder(): Promise<string> {
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
        items: [{ menuItemId: item.body.id, quantity: 1 }],
      })
      .expect(201);
    await http().post(`/orders/${order.body.id}/confirm`).expect(200);
    return order.body.id;
  }

  async function onlineCourier(
    name: string,
    location: { latitude: number; longitude: number },
  ): Promise<string> {
    const courier = await http().post('/couriers').send({ name }).expect(201);
    await http()
      .patch(`/couriers/${courier.body.id}/availability`)
      .send({ available: true, location })
      .expect(200);
    return courier.body.id;
  }

  describe('couriers', () => {
    it('registers an offline courier', async () => {
      const res = await http()
        .post('/couriers')
        .send({ name: 'Luis' })
        .expect(201);

      expect(res.body).toEqual({
        id: expect.any(String),
        name: 'Luis',
        status: 'offline',
      });
    });

    it('goes online with a location and updates it', async () => {
      const id = await onlineCourier('Luis', pickup);

      const res = await http()
        .patch(`/couriers/${id}/location`)
        .send({ latitude: 10, longitude: -84 })
        .expect(200);

      expect(res.body).toEqual({
        id,
        name: 'Luis',
        status: 'available',
        location: { latitude: 10, longitude: -84 },
      });
    });

    it('returns 404 for an unknown courier', async () => {
      await http()
        .patch('/couriers/unknown/availability')
        .send({ available: false })
        .expect(404);
    });

    it.each([
      ['an empty name', '/couriers', 'post', { name: '' }],
      ['an unknown field', '/couriers', 'post', { name: 'Luis', admin: true }],
    ])('returns 400 for %s', async (_case, url, _method, body) => {
      await http().post(url).send(body).expect(400);
    });

    it.each([
      ['going online without a location', { available: true }],
      [
        'an out of range latitude',
        { available: true, location: { latitude: 91, longitude: 0 } },
      ],
      ['a non boolean flag', { available: 'yes' }],
    ])('returns 400 for %s', async (_case, body) => {
      const courier = await http()
        .post('/couriers')
        .send({ name: 'Luis' })
        .expect(201);

      await http()
        .patch(`/couriers/${courier.body.id}/availability`)
        .send(body)
        .expect(400);
    });
  });

  describe('POST /deliveries', () => {
    it('requests a pending delivery for a confirmed order', async () => {
      const orderId = await confirmedOrder();

      const res = await http()
        .post('/deliveries')
        .send({ orderId, pickup, dropoff })
        .expect(201);

      expect(res.body).toEqual({
        id: expect.any(String),
        orderId,
        status: 'pending',
        pickup,
        dropoff,
        createdAt: expect.any(String),
      });
    });

    it('returns 404 for an unknown order', async () => {
      await http()
        .post('/deliveries')
        .send({ orderId: 'unknown', pickup, dropoff })
        .expect(404);
    });

    it('returns 409 for an order that is not confirmed', async () => {
      const orderId = await confirmedOrder();
      await http().post(`/orders/${orderId}/cancel`).expect(200);

      await http()
        .post('/deliveries')
        .send({ orderId, pickup, dropoff })
        .expect(409);
    });

    it('returns 409 when the order already has a delivery', async () => {
      const orderId = await confirmedOrder();
      await http()
        .post('/deliveries')
        .send({ orderId, pickup, dropoff })
        .expect(201);

      await http()
        .post('/deliveries')
        .send({ orderId, pickup, dropoff })
        .expect(409);
    });

    it.each([
      ['a missing pickup', { pickup: undefined }],
      ['an invalid dropoff', { dropoff: { latitude: 0, longitude: 200 } }],
      ['an unknown field', { tip: 5 }],
    ])('returns 400 for %s', async (_case, override) => {
      await http()
        .post('/deliveries')
        .send({ orderId: 'o-1', pickup, dropoff, ...override })
        .expect(400);
    });
  });

  describe('lifecycle', () => {
    let deliveryId: string;

    beforeEach(async () => {
      const orderId = await confirmedOrder();
      const res = await http()
        .post('/deliveries')
        .send({ orderId, pickup, dropoff })
        .expect(201);
      deliveryId = res.body.id;
    });

    it('dispatches to the nearest available courier', async () => {
      await onlineCourier('Far', { latitude: 10.5, longitude: -84.5 });
      const nearId = await onlineCourier('Near', {
        latitude: 9.931,
        longitude: -84.081,
      });

      const res = await http()
        .post(`/deliveries/${deliveryId}/dispatch`)
        .expect(200);

      expect(res.body).toMatchObject({ status: 'assigned', courierId: nearId });
    });

    it('returns 409 when no courier is available', async () => {
      await http().post(`/deliveries/${deliveryId}/dispatch`).expect(409);
    });

    it('runs the whole flow and frees the courier', async () => {
      const courierId = await onlineCourier('Luis', pickup);
      await http().post(`/deliveries/${deliveryId}/dispatch`).expect(200);

      const pickedUp = await http()
        .post(`/deliveries/${deliveryId}/pick-up`)
        .expect(200);
      const delivered = await http()
        .post(`/deliveries/${deliveryId}/complete`)
        .expect(200);
      const fetched = await http().get(`/deliveries/${deliveryId}`).expect(200);

      expect(pickedUp.body.status).toBe('picked_up');
      expect(delivered.body).toMatchObject({ status: 'delivered', courierId });
      expect(fetched.body.status).toBe('delivered');

      const freed = await http()
        .patch(`/couriers/${courierId}/availability`)
        .send({ available: false })
        .expect(200);
      expect(freed.body.status).toBe('offline');
    });

    it('keeps a busy courier from going offline', async () => {
      const courierId = await onlineCourier('Luis', pickup);
      await http().post(`/deliveries/${deliveryId}/dispatch`).expect(200);

      await http()
        .patch(`/couriers/${courierId}/availability`)
        .send({ available: false })
        .expect(409);
    });

    it('returns 409 for out-of-order steps', async () => {
      await http().post(`/deliveries/${deliveryId}/pick-up`).expect(409);
      await http().post(`/deliveries/${deliveryId}/complete`).expect(409);
    });

    it.each(['dispatch', 'pick-up', 'complete'])(
      'returns 404 on %s for an unknown delivery',
      async (action) => {
        await http().post(`/deliveries/unknown/${action}`).expect(404);
      },
    );

    it('returns 404 when fetching an unknown delivery', async () => {
      await http().get('/deliveries/unknown').expect(404);
    });
  });
});
