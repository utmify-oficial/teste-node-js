/* eslint-disable max-len */
import { Types } from 'mongoose';
import { UtmifyOrdersRepository } from '../../repositories/UtmifyOrdersRepository';
import { UtmifyIntegrationPlatform } from '../../types/UtmifyIntegrationPlatform';
import { UtmifyPaymentMethod } from '../../types/UtmifyPaymentMethod';
import { UtmifyTransactionStatus } from '../../types/UtmifyTransactionStatus';
import { GetOrderTransactionStatusUseCase, GetOrderTransactionStatusUseCaseInput } from '../GetOrderTransactionStatusUseCase';

describe('execute', () => {
  let repository: jest.Mocked<UtmifyOrdersRepository>;
  let usecase: GetOrderTransactionStatusUseCase;

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      getTransactionStatusBySaleId: jest.fn(),
    };
    usecase = new GetOrderTransactionStatusUseCase(repository);
  });

  it('should return null if the order is not found', async () => {
    repository.getTransactionStatusBySaleId.mockResolvedValue(null);

    const mockedInput = {
      saleId: 'sale_id',
    } as GetOrderTransactionStatusUseCaseInput;

    const res = await usecase.execute(mockedInput);

    expect(res).toEqual({ transactionStatus: null });
    expect(repository.getTransactionStatusBySaleId).toHaveBeenCalledWith('sale_id');
  });

  it('should return transaction status if the order is found', async function() {
    const mockOrder = {
      _id: new Types.ObjectId(),
      saleId: '9988776655',
      externalWebhookId: 'webhook_44556',
      platform: UtmifyIntegrationPlatform.AllOffers,
      paymentMethod: UtmifyPaymentMethod.Billet,
      transactionStatus: UtmifyTransactionStatus.Pending,
      products: [],
      customer: { id: 'ana.costa@example.com', fullName: 'Ana Costa', email: 'ana.costa@example.com', phone: '+5521987654321', country: 'BR' },
      values: { totalValueInCents: 0, sellerValueInCents: 0, shippingValueInCents: 0, platformValueInCents: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
      paidAt: null,
      refundedAt: null,
    };
    repository.getTransactionStatusBySaleId.mockResolvedValue(mockOrder);

    const mockedInput = {
      saleId: '9988776655',
    } as GetOrderTransactionStatusUseCaseInput;

    const res = await usecase.execute(mockedInput);

    expect(res).toEqual({ transactionStatus: UtmifyTransactionStatus.Pending });
    expect(repository.getTransactionStatusBySaleId).toHaveBeenCalledWith('9988776655');
  });
});
