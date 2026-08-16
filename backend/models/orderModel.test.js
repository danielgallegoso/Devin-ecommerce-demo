import mongoose from 'mongoose';
import Order from './orderModel';

const orderItem = (overrides = {}) => ({
  name: 'Phone A',
  qty: 2,
  image: '/images/a.jpg',
  price: '100',
  product: mongoose.Types.ObjectId(),
  ...overrides,
});

const buildOrder = (overrides = {}) =>
  new Order({
    user: mongoose.Types.ObjectId(),
    orderItems: [orderItem()],
    shipping: { address: '1 Main St', city: 'Bellevue', postalCode: '98006', country: 'USA' },
    payment: { paymentMethod: 'paypal' },
    itemsPrice: 200,
    taxPrice: 30,
    shippingPrice: 0,
    totalPrice: 230,
    ...overrides,
  });

describe('orderModel', () => {
  test('keeps the selected wireless plan on the order item it belongs to', () => {
    // Arrange
    const plan = { id: 'go5g-plus', name: 'Go5G Plus', monthlyPrice: 90 };
    const order = buildOrder({ orderItems: [orderItem({ plan })], monthlyPlanPrice: 180 });

    // Act
    const result = order.validateSync();

    // Assert
    expect(result).toBeUndefined();
    expect(order.orderItems[0].plan.toObject()).toEqual(plan);
  });

  test('defaults a device-only order to no plan and no monthly charge', () => {
    const order = buildOrder();

    expect(order.orderItems[0].plan).toBeNull();
    expect(order.monthlyPlanPrice).toBe(0);
  });

  test('casts a monthly plan price sent as a string', () => {
    const plan = { id: 'go5g', name: 'Go5G', monthlyPrice: '75' };
    const order = buildOrder({ orderItems: [orderItem({ plan })], monthlyPlanPrice: '150' });

    expect(order.validateSync()).toBeUndefined();
    expect(order.orderItems[0].plan.monthlyPrice).toBe(75);
    expect(order.monthlyPlanPrice).toBe(150);
  });

  test('rejects a plan that is missing its monthly price', () => {
    const order = buildOrder({
      orderItems: [orderItem({ plan: { id: 'go5g', name: 'Go5G' } })],
    });

    expect(() => {
      throw order.validateSync();
    }).toThrow('Path `monthlyPrice` is required.');
  });

  test('rejects a plan that is missing its identifying fields', () => {
    const order = buildOrder({
      orderItems: [orderItem({ plan: { monthlyPrice: 90 } })],
    });

    const result = order.validateSync();

    expect(Object.keys(result.errors)).toEqual(
      expect.arrayContaining(['orderItems.0.plan.id', 'orderItems.0.plan.name'])
    );
  });

  test('rejects a non-numeric monthly plan price', () => {
    const order = buildOrder({
      orderItems: [orderItem({ plan: { id: 'go5g', name: 'Go5G', monthlyPrice: 'seventy-five' } })],
    });

    expect(order.validateSync().errors['orderItems.0.plan.monthlyPrice']).toBeDefined();
  });

  test('accepts a fractional monthly plan total', () => {
    const order = buildOrder({ monthlyPlanPrice: 179.98 });

    expect(order.validateSync()).toBeUndefined();
    expect(order.monthlyPlanPrice).toBeCloseTo(179.98, 2);
  });
});
