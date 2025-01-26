import { TransactionError } from '../../../../core/errors/TransactionError';
import { MongoDB } from '../../../../database/MongoDB';
import { UtmifyOrderModel } from '../../models/UtmifyOrderModel';
import { UtmifyIntegrationPlatform } from '../../types/UtmifyIntegrationPlatform';
import { UtmifyOrder } from '../../types/UtmifyOrder';
import { UtmifyPaymentMethod } from '../../types/UtmifyPaymentMethod';
import { UtmifyTransactionStatus } from '../../types/UtmifyTransactionStatus';
import { UtmifyOrdersRepositoryMongoose } from '../implementations/UtmifyOrdersRepositoryMongoose';

const repository = new UtmifyOrdersRepositoryMongoose();

beforeAll(async () => await MongoDB.connect());

describe('save', () => {
  const getBaseData = () => ({
    saleId: Math.random().toString(),
    externalWebhookId: 'externalWebhookId',
    paymentMethod: UtmifyPaymentMethod.Pix,
    platform: UtmifyIntegrationPlatform.WorldMarket,
    transactionStatus: UtmifyTransactionStatus.Paid,
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
    const updatedOrder = await repository.save({ ...baseData, updatedAt: updateDate });

    expect(savedOrder).not.toBeNull();
    expect(updatedOrder).not.toBeNull();

    expect(savedOrder?._id?.toString()).toEqual(updatedOrder?._id?.toString());

    expect(savedOrder?.updatedAt).toEqual(baseData.updatedAt);
    expect(updatedOrder?.updatedAt).toEqual(updateDate);

    await UtmifyOrderModel.deleteOne({ _id: savedOrder?._id });
  });

  it('should throw an error when trying to update a paid order to pending state', async () => {
    const baseData = getBaseData();
    const savedOrder = await repository.save(baseData);
    const foundOrder = await UtmifyOrderModel.findById(savedOrder?._id);
    await expect(repository.save({ ...baseData, transactionStatus: UtmifyTransactionStatus.Pending }))
    .rejects
    .toThrow(new TransactionError('Invalid order transaction status update'));
  });

  it('should throw an error when trying to update a refunded order to paid state', async () => {
    const baseData = getBaseData();
    const savedOrder = await repository.save({ ...baseData, transactionStatus: UtmifyTransactionStatus.Refunded });
    const foundOrder = await UtmifyOrderModel.findById(savedOrder?._id);
    await expect(repository.save({ ...baseData, transactionStatus: UtmifyTransactionStatus.Paid }))
    .rejects
    .toThrow(new TransactionError('Invalid order transaction status update'));
  });

  it('should throw an error when trying to update a refunded order to pending state', async () => {
    const baseData = getBaseData();
    const savedOrder = await repository.save({ ...baseData, transactionStatus: UtmifyTransactionStatus.Refunded });
    const foundOrder = await UtmifyOrderModel.findById(savedOrder?._id);
    await expect(repository.save({ ...baseData, transactionStatus: UtmifyTransactionStatus.Pending }))
    .rejects
    .toThrow(new TransactionError('Invalid order transaction status update'));
  });
});

afterAll(async () => await MongoDB.disconnect());
