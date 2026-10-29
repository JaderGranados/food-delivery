import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('Coupons (e2e)', () => {
  let app: INestApplication<App>;

  const http = () => request(app.getHttpServer());

  const validBody = {
    code: 'summer10',
    discount: { type: 'percentage', percent: 10 },
    validFrom: '2020-01-01T00:00:00.000Z',
    validUntil: '2099-01-01T00:00:00.000Z',
  };
  const subtotal = { amount: 1000000, currency: 'CRC' };

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

  describe('POST /coupons', () => {
    it('creates a coupon with an upper-cased code', async () => {
      const res = await http().post('/coupons').send(validBody).expect(201);

      expect(res.body).toEqual({
        id: expect.any(String),
        code: 'SUMMER10',
        discount: { type: 'percentage', percent: 10 },
        validFrom: validBody.validFrom,
        validUntil: validBody.validUntil,
        redemptionCount: 0,
        createdAt: expect.any(String),
      });
    });

    it('creates a fixed coupon with a minimum order and a usage limit', async () => {
      const res = await http()
        .post('/coupons')
        .send({
          ...validBody,
          discount: { type: 'fixed', amount: 200000, currency: 'CRC' },
          minimumOrder: { amount: 500000, currency: 'CRC' },
          usageLimit: 5,
        })
        .expect(201);

      expect(res.body).toMatchObject({
        discount: { type: 'fixed', amount: 200000, currency: 'CRC' },
        minimumOrder: { amount: 500000, currency: 'CRC' },
        usageLimit: 5,
        remainingUses: 5,
      });
    });

    it('returns 409 for a code that is taken, in any case', async () => {
      await http().post('/coupons').send(validBody).expect(201);

      await http()
        .post('/coupons')
        .send({ ...validBody, code: 'SUMMER10' })
        .expect(409);
    });

    it.each([
      ['a short code', { code: 'ab' }],
      ['a code with symbols', { code: 'bad code!' }],
      ['an unknown discount type', { discount: { type: 'bogo' } }],
      [
        'a percent above 100',
        { discount: { type: 'percentage', percent: 101 } },
      ],
      ['a missing percent', { discount: { type: 'percentage' } }],
      [
        'a fixed discount without a currency',
        { discount: { type: 'fixed', amount: 100 } },
      ],
      ['a missing discount', { discount: undefined }],
      ['an invalid date', { validFrom: 'yesterday' }],
      ['an end before the start', { validUntil: '2019-01-01T00:00:00.000Z' }],
      ['a zero usage limit', { usageLimit: 0 }],
      ['an unknown field', { stackable: true }],
    ])('returns 400 for %s', async (_case, override) => {
      await http()
        .post('/coupons')
        .send({ ...validBody, ...override })
        .expect(400);
    });
  });

  describe('GET /coupons/:code', () => {
    it('finds the coupon whatever the case of the code', async () => {
      await http().post('/coupons').send(validBody).expect(201);

      const res = await http().get('/coupons/Summer10').expect(200);

      expect(res.body.code).toBe('SUMMER10');
    });

    it('returns 404 for an unknown coupon', async () => {
      await http().get('/coupons/NOPE').expect(404);
    });
  });

  describe('POST /coupons/:code/discount', () => {
    it('quotes the discount without using the coupon', async () => {
      await http()
        .post('/coupons')
        .send({ ...validBody, usageLimit: 1 })
        .expect(201);

      const res = await http()
        .post('/coupons/SUMMER10/discount')
        .send({ subtotal })
        .expect(200);
      const coupon = await http().get('/coupons/SUMMER10').expect(200);

      expect(res.body).toEqual({
        couponId: expect.any(String),
        code: 'SUMMER10',
        subtotal,
        discount: { amount: 100000, currency: 'CRC' },
        total: { amount: 900000, currency: 'CRC' },
      });
      expect(coupon.body.remainingUses).toBe(1);
    });

    it('caps a fixed discount at the subtotal', async () => {
      await http()
        .post('/coupons')
        .send({
          ...validBody,
          discount: { type: 'fixed', amount: 5000000, currency: 'CRC' },
        })
        .expect(201);

      const res = await http()
        .post('/coupons/SUMMER10/discount')
        .send({ subtotal })
        .expect(200);

      expect(res.body.discount.amount).toBe(1000000);
      expect(res.body.total.amount).toBe(0);
    });

    it('returns 404 for an unknown coupon', async () => {
      await http()
        .post('/coupons/NOPE/discount')
        .send({ subtotal })
        .expect(404);
    });

    it('returns 409 for an expired coupon', async () => {
      await http()
        .post('/coupons')
        .send({
          ...validBody,
          validFrom: '2020-01-01T00:00:00.000Z',
          validUntil: '2021-01-01T00:00:00.000Z',
        })
        .expect(201);

      await http()
        .post('/coupons/SUMMER10/discount')
        .send({ subtotal })
        .expect(409);
    });

    it('returns 409 for a coupon that has not started', async () => {
      await http()
        .post('/coupons')
        .send({
          ...validBody,
          validFrom: '2098-01-01T00:00:00.000Z',
          validUntil: '2099-01-01T00:00:00.000Z',
        })
        .expect(201);

      await http()
        .post('/coupons/SUMMER10/discount')
        .send({ subtotal })
        .expect(409);
    });

    it('returns 409 below the minimum order', async () => {
      await http()
        .post('/coupons')
        .send({
          ...validBody,
          minimumOrder: { amount: 2000000, currency: 'CRC' },
        })
        .expect(201);

      await http()
        .post('/coupons/SUMMER10/discount')
        .send({ subtotal })
        .expect(409);
    });

    it('returns 400 for a different currency than the minimum', async () => {
      await http()
        .post('/coupons')
        .send({ ...validBody, minimumOrder: { amount: 100, currency: 'CRC' } })
        .expect(201);

      await http()
        .post('/coupons/SUMMER10/discount')
        .send({ subtotal: { amount: 1000, currency: 'USD' } })
        .expect(400);
    });

    it.each([
      ['a missing subtotal', {}],
      ['a negative amount', { subtotal: { amount: -1, currency: 'CRC' } }],
      ['a bad currency', { subtotal: { amount: 100, currency: 'colones' } }],
    ])('returns 400 for %s', async (_case, body) => {
      await http().post('/coupons').send(validBody).expect(201);

      await http().post('/coupons/SUMMER10/discount').send(body).expect(400);
    });
  });

  describe('POST /coupons/:code/redeem', () => {
    beforeEach(async () => {
      await http()
        .post('/coupons')
        .send({ ...validBody, usageLimit: 2 })
        .expect(201);
    });

    it('redeems the coupon for an order', async () => {
      const res = await http()
        .post('/coupons/summer10/redeem')
        .send({ orderId: 'o-1', subtotal })
        .expect(201);
      const coupon = await http().get('/coupons/SUMMER10').expect(200);

      expect(res.body).toEqual({
        couponId: expect.any(String),
        code: 'SUMMER10',
        orderId: 'o-1',
        subtotal,
        discount: { amount: 100000, currency: 'CRC' },
        total: { amount: 900000, currency: 'CRC' },
        redeemedAt: expect.any(String),
      });
      expect(coupon.body).toMatchObject({
        redemptionCount: 1,
        remainingUses: 1,
      });
    });

    it('returns 409 when the order already used the coupon', async () => {
      await http()
        .post('/coupons/SUMMER10/redeem')
        .send({ orderId: 'o-1', subtotal })
        .expect(201);

      await http()
        .post('/coupons/SUMMER10/redeem')
        .send({ orderId: 'o-1', subtotal })
        .expect(409);
    });

    it('returns 409 once the usage limit is reached', async () => {
      await http()
        .post('/coupons/SUMMER10/redeem')
        .send({ orderId: 'o-1', subtotal })
        .expect(201);
      await http()
        .post('/coupons/SUMMER10/redeem')
        .send({ orderId: 'o-2', subtotal })
        .expect(201);

      await http()
        .post('/coupons/SUMMER10/redeem')
        .send({ orderId: 'o-3', subtotal })
        .expect(409);
    });

    it('returns 404 for an unknown coupon', async () => {
      await http()
        .post('/coupons/NOPE/redeem')
        .send({ orderId: 'o-1', subtotal })
        .expect(404);
    });

    it.each([
      ['a missing order id', { subtotal }],
      ['a missing subtotal', { orderId: 'o-1' }],
      ['an unknown field', { orderId: 'o-1', subtotal, discount: 1 }],
    ])('returns 400 for %s', async (_case, body) => {
      await http().post('/coupons/SUMMER10/redeem').send(body).expect(400);
    });
  });
});
