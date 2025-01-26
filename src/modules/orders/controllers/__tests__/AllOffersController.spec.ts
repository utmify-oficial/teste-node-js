import { Request, Response } from 'express';
import { AllOffersController } from '../AllOffersController';
import { SaveUtmifyOrderUseCase, SaveUtmifyOrderUseCaseInput } from '../../usecases/SaveUtmifyOrderUseCase';
import { UtmifyTransactionStatus } from '../../types/utimify/UtmifyTransactionStatus';
import { UtmifyPaymentMethod } from '../../types/utimify/UtmifyPaymentMethod';
import { AllOffersOrder } from '../../types/allOffers/AllOffersOrder';
import { UtmifyOrdersRepositoryMongoose } from '../../repositories/implementations/UtmifyOrdersRepositoryMongoose';
import { UtmifyProduct } from '../../types/utimify/UtmifyProduct';
import { UtmifyCustomer } from '../../types/utimify/UtmifyCustomer';
import { UtmifyValues } from '../../types/utimify/UtmifyValues';
import { UtmifyIntegrationPlatform } from '../../types/utimify/UtmifyIntegrationPlatform';
import { RequestError } from '../../../../core/errors/RequestError';
import { AllOffersOrderItem } from '../../types/allOffers/AllOffersProduct';
import { AllOffersCustomer } from '../../types/allOffers/AllOffersCustomer';

const repository = new UtmifyOrdersRepositoryMongoose();
const usecase = new SaveUtmifyOrderUseCase(repository);
const controller = new AllOffersController(usecase);

const body: AllOffersOrder = {
  WebhookId: 'webhook_44556',
  OrderId: '9988776655',
  PaymentMethod: 'Boleto',
  UserCommission: 75.00,
  TotalSaleAmount: 750.00,
  PlatformCommission: 90.00,
  Currency: 'USD',
  SaleStatus: 'AwaitingPayment',
  Customer: {
    FirstName: 'Ana',
    LastName: 'Costa',
    Phone: '+5521987654321',
    Email: 'ana.costa@example.com',
    Country: 'BR',
    BillingAddress: {
      Street: 'Rua das Laranjeiras, 500',
      City: 'Rio de Janeiro',
      State: 'RJ',
      ZipCode: '22240-003',
      Country: 'BR',
    },
    ShippingAddress: {
      Street: 'Rua Marquês de Abrantes, 250',
      City: 'Rio de Janeiro',
      State: 'RJ',
      ZipCode: '22230-060',
      Country: 'BR',
    },
  },
  OrderCreatedDate: '2025-01-24T11:00:00Z',
  PaymentDate: null,
  RefundDate: null,
  PaymentGateway: 'Boleto',
  OrderNotes: 'Aguardando pagamento via boleto bancário.',
  CouponCode: 'VERAO10',
  Items: [
    {
      ItemId: 'prod_321',
      ItemName: 'Wireless Headphones',
      Quantity: 1,
      UnitPrice: 750.00,
      ItemCategory: 'Electronics',
      ItemBrand: 'AudioMax',
      ItemSku: 'WH-890123',
    },
  ],
  ShippingDetails: {
    ShippingMethod: 'Express',
    EstimatedDeliveryDate: '2025-01-28T16:00:00Z',
    TrackingNumber: null,
    ShippingStatus: 'Pending',
  },
  PaymentDetails: {
    PaymentStatus: 'Pending',
    PaymentMethodDetails: {
      BoletoNumber: 'BOLETO9876543210',
    },
  },
};
describe('handle', () => {

  it('should call usecase with correct params', async () => {

    const mockedMethod = UtmifyPaymentMethod.Pix;
    jest.spyOn(controller, 'AllOffersPaymentMethodToUtmifyPaymentMethod').mockReturnValueOnce(mockedMethod);

    const mockedStatus = UtmifyTransactionStatus.Paid;
    jest.spyOn(controller, 'AllOffersStatusToUtmifyTransactionStatus').mockReturnValueOnce(mockedStatus);

    const mockedProducts: UtmifyProduct[] = [];
    jest.spyOn(controller, 'AllOffersProductsToUtmifyProducts').mockReturnValueOnce(Promise.resolve(mockedProducts));

    const mockedCustomer: UtmifyCustomer = {
      country: 'country',
      email: 'email',
      fullName: 'fullName',
      id: 'id',
      phone: 'phone',
    };
    jest.spyOn(controller, 'AllOffersCustomerToUtmifyCustomer').mockReturnValueOnce(mockedCustomer);

    const mockedValues: UtmifyValues = {
      platformValueInCents: 0,
      sellerValueInCents: 0,
      shippingValueInCents: 0,
      totalValueInCents: 0,
    };
    jest.spyOn(controller, 'AllOffersBodyToUtmifyValues').mockReturnValueOnce(Promise.resolve(mockedValues));

    jest.spyOn(usecase, 'execute').mockResolvedValueOnce();

    const mockedExpressRes = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const res = await controller.handle({ body } as Request, mockedExpressRes as unknown as Response);

    expect(res).toBe(mockedExpressRes.status(200).send());

    expect(controller.AllOffersPaymentMethodToUtmifyPaymentMethod).toHaveBeenCalledTimes(1);
    expect(controller.AllOffersStatusToUtmifyTransactionStatus).toHaveBeenCalledTimes(1);
    expect(controller.AllOffersProductsToUtmifyProducts).toHaveBeenCalledTimes(1);
    expect(controller.AllOffersCustomerToUtmifyCustomer).toHaveBeenCalledTimes(1);
    expect(controller.AllOffersBodyToUtmifyValues).toHaveBeenCalledTimes(1);
    expect(usecase.execute).toHaveBeenCalledTimes(1);

    expect(usecase.execute).toHaveBeenCalledWith({
      data: {
        saleId: body.OrderId,
        externalWebhookId: body.WebhookId,
        platform: UtmifyIntegrationPlatform.AllOffers,
        paymentMethod: mockedMethod,
        transactionStatus: mockedStatus,
        products: mockedProducts,
        customer: mockedCustomer,
        values: mockedValues,
        createdAt: new Date(body.OrderCreatedDate),
        updatedAt: expect.any(Date),
        paidAt: new Date(body.PaymentDate as string),
        refundedAt: null,
      },
      additionalInfo: {
        currency: 'BRL',
      },
    } as SaveUtmifyOrderUseCaseInput);

    expect(controller.AllOffersPaymentMethodToUtmifyPaymentMethod)
      .toHaveBeenCalledWith(body.PaymentMethod);
    expect(controller.AllOffersStatusToUtmifyTransactionStatus).toHaveBeenCalledWith(body.SaleStatus);
    expect(controller.AllOffersProductsToUtmifyProducts).toHaveBeenCalledWith(body.Items, body.Currency);
    expect(controller.AllOffersCustomerToUtmifyCustomer).toHaveBeenCalledWith(body.Customer);
    expect(controller.AllOffersBodyToUtmifyValues).toHaveBeenCalledWith(body);
  });
});

describe('allOffersPaymentMethodToUtmifyPaymentMethod', () => {
  it('should return correct utmify payment method', () => {
    expect(controller.AllOffersPaymentMethodToUtmifyPaymentMethod('Pix'))
      .toBe(UtmifyPaymentMethod.Pix);

    expect(controller.AllOffersPaymentMethodToUtmifyPaymentMethod('Boleto'))
      .toBe(UtmifyPaymentMethod.Billet);

    expect(controller.AllOffersPaymentMethodToUtmifyPaymentMethod('CreditCard'))
      .toBe(UtmifyPaymentMethod.CreditCard);
  });

  it('should throw request error if method is invalid', () => {
    const method = 'any other' as any;

    try {
      controller.AllOffersPaymentMethodToUtmifyPaymentMethod(method);
    } catch (e) {
      expect(e).toEqual(new RequestError(400, `Unknown payment method: ${method}`));
    }
  });
});

describe('allOffersStatusToUtmifyTransactionStatus', () => {
  it('should return correct utmify transaction status', () => {
    expect(controller.AllOffersStatusToUtmifyTransactionStatus('AwaitingPayment'))
      .toBe(UtmifyTransactionStatus.Pending);

    expect(controller.AllOffersStatusToUtmifyTransactionStatus('Paid'))
      .toBe(UtmifyTransactionStatus.Paid);

    expect(controller.AllOffersStatusToUtmifyTransactionStatus('Refunded'))
      .toBe(UtmifyTransactionStatus.Refunded);
  });

  it('should throw request error if method is invalid', () => {
    const status = 'any other' as any;

    try {
      controller.AllOffersStatusToUtmifyTransactionStatus(status);
    } catch (e) {
      expect(e).toEqual(new RequestError(400, `Unknown payment status: ${status}`));
    }
  });
});

describe('allOffersProductsToUtmifyProducts', () => {
  it('should return correct utmify products', async () => {
    const allOffersProducts: AllOffersOrderItem[] = [
      {
        ItemName: 'T-Shirt',
        ItemCategory: 'clothes',
        UnitPrice: 97.00,
        ItemId: '12k3hkahsd',
        Quantity: 1,
        ItemBrand: 'AudioMax',
        ItemSku: 'WH-890123',
      },
      {
        ItemName: 'Pants',
        ItemCategory: 'clothes',
        UnitPrice: 119.90,
        ItemId: '12k3hkahsh',
        Quantity: 2,
        ItemBrand: 'AudioMax',
        ItemSku: 'WH-890123',
      },
    ];

    jest.spyOn(controller['convertOrderCurrencyAction'], 'execute')
      .mockImplementation(async ({ currency, value }) => {
        if (currency === 'USD') {
          return value * 5.2;
        }
        return value;
      });

    const result = await controller.AllOffersProductsToUtmifyProducts(allOffersProducts, 'USD');

    expect(result).toEqual([
      {
        id: '12k3hkahsd',
        name: 'T-Shirt',
        priceInCents: Math.round(100 * 97.00 * 5.2),
        quantity: 1,
      },
      {
        id: '12k3hkahsh',
        name: 'Pants',
        priceInCents: Math.round(100 * 119.90 * 5.2),
        quantity: 2,
      },
    ] as UtmifyProduct[]);
  });

});

describe('allOffersCustomerToUtmifyCustomer', () => {
  it('should return correct utmify customer', () => {
    const allOffersCustomer: AllOffersCustomer = {
      FirstName: 'Ana',
      LastName: 'Costa',
      Phone: '+5521987654321',
      Email: 'ana.costa@example.com',
      Country: 'BR',
      BillingAddress: {
        Street: 'Rua das Laranjeiras, 500',
        City: 'Rio de Janeiro',
        State: 'RJ',
        ZipCode: '22240-003',
        Country: 'BR',
      },
      ShippingAddress: {
        Street: 'Rua Marquês de Abrantes, 250',
        City: 'Rio de Janeiro',
        State: 'RJ',
        ZipCode: '22230-060',
        Country: 'BR',
      },
    };

    expect(controller.AllOffersCustomerToUtmifyCustomer(allOffersCustomer)).toEqual({
      id: expect.any(String),
      fullName: `${allOffersCustomer.FirstName} ${allOffersCustomer.LastName}`,
      email: allOffersCustomer.Email,
      phone: allOffersCustomer.Phone,
      country: allOffersCustomer.BillingAddress.Country,
    } as UtmifyCustomer);
  });
});

describe('allOffersBodyToUtmifyValues', () => {
  it('should return correct utmify values', async () => {

    const expectedValues: UtmifyValues = {
      totalValueInCents: 100 * body.TotalSaleAmount * 5.2,
      sellerValueInCents: 100 * body.UserCommission * 5.2,
      platformValueInCents: 100 * body.PlatformCommission * 5.2,
      shippingValueInCents: null,
    };

    jest.spyOn(controller['convertOrderCurrencyAction'], 'execute')
      .mockImplementation(async ({ currency, value }) => {
        if (currency === 'USD') {
          return value * 5.2;
        }
        return value;
      });

    const result = await controller.AllOffersBodyToUtmifyValues(body);

    expect(result).toEqual(expectedValues);
  });
});
