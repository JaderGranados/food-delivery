import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('Restaurant menu (e2e)', () => {
  let app: INestApplication<App>;
  let restaurantId: string;

  const validItem = {
    name: 'Casado',
    description: 'Rice, beans and chicken',
    price: { amount: 350000, currency: 'CRC' },
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const res = await request(app.getHttpServer())
      .post('/restaurants')
      .send({
        name: 'Soda Tica',
        openingHours: [{ day: 'monday', open: '09:00', close: '22:00' }],
      })
      .expect(201);
    restaurantId = res.body.id;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /restaurants/:id/menu-items', () => {
    it('adds an available item', async () => {
      const res = await request(app.getHttpServer())
        .post(`/restaurants/${restaurantId}/menu-items`)
        .send(validItem)
        .expect(201);

      expect(res.body).toEqual({
        id: expect.any(String),
        ...validItem,
        available: true,
      });
    });

    it('accepts an item without description', async () => {
      const { description: _description, ...body } = validItem;
      await request(app.getHttpServer())
        .post(`/restaurants/${restaurantId}/menu-items`)
        .send(body)
        .expect(201);
    });

    it('returns 404 when the restaurant does not exist', async () => {
      await request(app.getHttpServer())
        .post('/restaurants/unknown-id/menu-items')
        .send(validItem)
        .expect(404);
    });

    it.each([
      ['a missing name', { ...validItem, name: undefined }],
      ['a missing price', { ...validItem, price: undefined }],
      [
        'a negative price',
        { ...validItem, price: { amount: -1, currency: 'CRC' } },
      ],
      [
        'a fractional price',
        { ...validItem, price: { amount: 1.5, currency: 'CRC' } },
      ],
      [
        'an invalid currency',
        { ...validItem, price: { amount: 100, currency: 'colones' } },
      ],
      ['an unknown field', { ...validItem, stock: 3 }],
    ])('returns 400 for %s', async (_case, body) => {
      await request(app.getHttpServer())
        .post(`/restaurants/${restaurantId}/menu-items`)
        .send(body)
        .expect(400);
    });
  });

  describe('PATCH /restaurants/:id/menu-items/:itemId/availability', () => {
    let itemId: string;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post(`/restaurants/${restaurantId}/menu-items`)
        .send(validItem)
        .expect(201);
      itemId = res.body.id;
    });

    it('marks the item as unavailable', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/restaurants/${restaurantId}/menu-items/${itemId}/availability`)
        .send({ available: false })
        .expect(200);

      expect(res.body).toMatchObject({ id: itemId, available: false });
    });

    it('returns 404 for an unknown restaurant', async () => {
      await request(app.getHttpServer())
        .patch(`/restaurants/unknown/menu-items/${itemId}/availability`)
        .send({ available: false })
        .expect(404);
    });

    it('returns 404 for an unknown item', async () => {
      await request(app.getHttpServer())
        .patch(`/restaurants/${restaurantId}/menu-items/unknown/availability`)
        .send({ available: false })
        .expect(404);
    });

    it('returns 400 for a non boolean value', async () => {
      await request(app.getHttpServer())
        .patch(`/restaurants/${restaurantId}/menu-items/${itemId}/availability`)
        .send({ available: 'no' })
        .expect(400);
    });
  });

  describe('GET /restaurants/:id/menu', () => {
    it('returns the menu with availability', async () => {
      const added = await request(app.getHttpServer())
        .post(`/restaurants/${restaurantId}/menu-items`)
        .send(validItem)
        .expect(201);
      await request(app.getHttpServer())
        .patch(
          `/restaurants/${restaurantId}/menu-items/${added.body.id}/availability`,
        )
        .send({ available: false })
        .expect(200);

      const res = await request(app.getHttpServer())
        .get(`/restaurants/${restaurantId}/menu`)
        .expect(200);

      expect(res.body).toEqual({
        restaurantId,
        name: 'Soda Tica',
        items: [{ ...added.body, available: false }],
      });
    });

    it('returns 404 when the restaurant does not exist', async () => {
      await request(app.getHttpServer())
        .get('/restaurants/unknown-id/menu')
        .expect(404);
    });
  });
});
