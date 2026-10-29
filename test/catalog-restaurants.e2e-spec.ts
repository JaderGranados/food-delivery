import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('POST /restaurants (e2e)', () => {
  let app: INestApplication<App>;

  const validBody = {
    name: 'Soda Tica',
    openingHours: [
      { day: 'monday', open: '09:00', close: '14:00' },
      { day: 'monday', open: '18:00', close: '22:00' },
    ],
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

  it('registers a restaurant', async () => {
    const res = await request(app.getHttpServer())
      .post('/restaurants')
      .send(validBody)
      .expect(201);

    expect(res.body).toEqual({
      id: expect.any(String),
      name: 'Soda Tica',
      openingHours: validBody.openingHours,
      createdAt: expect.any(String),
    });
  });

  it.each([
    ['a missing name', { ...validBody, name: undefined }],
    ['no opening hours', { ...validBody, openingHours: [] }],
    [
      'an unknown day',
      {
        ...validBody,
        openingHours: [{ day: 'funday', open: '09:00', close: '10:00' }],
      },
    ],
    [
      'a malformed time',
      {
        ...validBody,
        openingHours: [{ day: 'monday', open: '9am', close: '10:00' }],
      },
    ],
    [
      'close before open',
      {
        ...validBody,
        openingHours: [{ day: 'monday', open: '10:00', close: '09:00' }],
      },
    ],
    [
      'overlapping slots',
      {
        ...validBody,
        openingHours: [
          { day: 'monday', open: '09:00', close: '15:00' },
          { day: 'monday', open: '14:00', close: '20:00' },
        ],
      },
    ],
    ['an unknown field', { ...validBody, rating: 5 }],
  ])('returns 400 for %s', async (_case, body) => {
    await request(app.getHttpServer())
      .post('/restaurants')
      .send(body)
      .expect(400);
  });
});
