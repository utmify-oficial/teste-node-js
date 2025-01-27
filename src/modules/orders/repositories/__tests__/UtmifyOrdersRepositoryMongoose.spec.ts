import { MongoDB } from '../../../../database/MongoDB';
import { UtmifyOrderModel } from '../../models/UtmifyOrderModel';
import { UtmifyIntegrationPlatform } from '../../types/utmify/UtmifyIntegrationPlatform';
import { UtmifyOrder } from '../../types/utmify/UtmifyOrder';
import { UtmifyPaymentMethod } from '../../types/utmify/UtmifyPaymentMethod';
import { UtmifyTransactionStatus } from '../../types/utmify/UtmifyTransactionStatus';
import { UtmifyOrdersRepositoryMongoose } from '../implementations/UtmifyOrdersRepositoryMongoose';

const repository = new UtmifyOrdersRepositoryMongoose();

beforeAll(async () => await MongoDB.connect());

describe('save', () => {
  const getBaseData = () => ({
    saleId: Math.random().toString(),
    externalWebhookId: 'externalWebhookId',
    paymentMethod: UtmifyPaymentMethod.Pix,
    platform: UtmifyIntegrationPlatform.WorldMarket,
    transactionStatus: UtmifyTransactionStatus.Pending,
    paidAt: new Date('2025-01-25T12:00:00Z'),
    products: [{
      id: 'id',
      name: 'name',
      priceInCents: 0,
      quantity: 1,
    }],
    refundedAt: null,
    customer: {
      country: 'country',
      email: 'email',
      fullName: 'fullName',
      id: 'id',
      phone: 'phone',
    },
    values: {
      platformValueInCents: 0,
      sellerValueInCents: 0,
      shippingValueInCents: 0,
      totalValueInCents: 0,
    },
    createdAt: new Date('2025-01-25T12:00:00Z'),
    updatedAt: new Date('2025-01-25T12:00:00Z'),
  } as UtmifyOrder);

  it('should save new order correctly', async () => {
    const savedOrder = await repository.save(getBaseData());

    const foundOrder = await UtmifyOrderModel.findById(savedOrder?._id);

    expect(savedOrder).not.toBeNull();
    expect(foundOrder).not.toBeNull();
    expect(savedOrder?._id.toString()).toEqual(foundOrder?._id?.toString());

    await UtmifyOrderModel.deleteOne({ _id: foundOrder?._id });
  });

  it('should update order correctly', async () => {
    const baseData = getBaseData();

    const savedOrder = await repository.save(baseData);

    const updateDate = new Date('2025-01-25T16:00:00Z');
    const updatedOrder = await repository.save({ ...baseData, transactionStatus: UtmifyTransactionStatus.Paid, updatedAt: updateDate });

    expect(savedOrder).not.toBeNull();
    expect(updatedOrder).not.toBeNull();

    expect(savedOrder?._id?.toString()).toEqual(updatedOrder?._id?.toString());

    expect(savedOrder?.updatedAt).toEqual(baseData.updatedAt);
    expect(updatedOrder?.updatedAt).toEqual(updateDate);

    await UtmifyOrderModel.deleteOne({ _id: savedOrder?._id });
  });
});

describe('save with existing order', () => {
  const baseData = {
    saleId: Math.random().toString(),
    externalWebhookId: 'existingWebhookId',
    paymentMethod: UtmifyPaymentMethod.Pix,
    platform: UtmifyIntegrationPlatform.WorldMarket,
    transactionStatus: UtmifyTransactionStatus.Pending,
    paidAt: new Date('2025-01-25T12:00:00Z'),
    products: [
      {
        id: 'id',
        name: 'name',
        priceInCents: 0,
        quantity: 1,
      },
    ],
    refundedAt: null,
    customer: {
      country: 'country',
      email: 'email',
      fullName: 'fullName',
      id: 'id',
      phone: 'phone',
    },
    values: {
      platformValueInCents: 0,
      sellerValueInCents: 0,
      shippingValueInCents: 0,
      totalValueInCents: 0,
    },
    createdAt: new Date('2025-01-25T12:00:00Z'),
    updatedAt: new Date('2025-01-25T12:00:00Z'),
  } as UtmifyOrder;

  beforeAll(async () => {
    await UtmifyOrderModel.create(baseData);
  });

  afterEach(async () => {
    await UtmifyOrderModel.deleteOne({
      saleId: baseData.saleId,
      platform: baseData.platform,
      externalWebhookId: baseData.externalWebhookId,
    });
  });

  it('should update the order when status change is valid', async () => {
    const repository = new UtmifyOrdersRepositoryMongoose();

    const validUpdate = { ...baseData, transactionStatus: UtmifyTransactionStatus.Paid };

    const updatedOrder = await repository.save(validUpdate);

    expect(updatedOrder).not.toBeNull();
    expect(updatedOrder?.transactionStatus).toBe(UtmifyTransactionStatus.Paid);
  });

  it('should not update the order when status change is invalid (Paid -> Pending)', async () => {
    const repository = new UtmifyOrdersRepositoryMongoose();
    const data = {
      ...baseData,
      saleId: Math.random().toString(),
      externalWebhookId: 'testWebhookId',
      transactionStatus: UtmifyTransactionStatus.Paid,
    };
    const invalidUpdate = {
      ...data,
      transactionStatus: UtmifyTransactionStatus.Pending,
    };

    await UtmifyOrderModel.create(data);

    await expect(repository.save(invalidUpdate)).rejects.toThrow(
      'Attempt to update order status from Paid to Pending, which is not allowed.',
    );

  });
});
afterAll(async () => await MongoDB.disconnect());
