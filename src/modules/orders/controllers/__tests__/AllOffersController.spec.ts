import { RequestError } from '../../../../core/errors/RequestError';
import { UtmifyOrdersRepositoryMongoose } from '../../repositories/implementations/UtmifyOrdersRepositoryMongoose';
import { UtmifyCustomer } from '../../types/UtmifyCustomer';
import { UtmifyPaymentMethod } from '../../types/UtmifyPaymentMethod';
import { UtmifyProduct } from '../../types/UtmifyProduct';
import { UtmifyTransactionStatus } from '../../types/UtmifyTransactionStatus';
import { UtmifyValues } from '../../types/UtmifyValues';
import { SaveUtmifyOrderUseCase, SaveUtmifyOrderUseCaseInput } from '../../usecases/SaveUtmifyOrderUseCase';
import {
  AllOffersBody,
  AllOffersController,
  AllOffersCustomer,
  AllOffersItem,
} from '../AllOffersController';
import { App } from '../../../../server/App';
import { UtmifyIntegrationPlatform } from '../../types/UtmifyIntegrationPlatform';
import { Request, Response } from 'express';

const repository = new UtmifyOrdersRepositoryMongoose();
const usecase = new SaveUtmifyOrderUseCase(repository);
const controller = new AllOffersController(usecase);
const test_order: AllOffersBody = {
  WebhookId: 'webhook_55668',
  OrderId: 4455667789,
  PaymentMethod: 'CreditCard',
  UserCommission: 35.99,
  TotalSaleAmount: 12318.99,
  PlatformCommission: 39.00,
  Currency: 'BRL',
  SaleStatus: 'Paid',
  Customer: {
    FirstName: 'John',
    LastName: 'Doe',
    Phone: '+5545900000000',
    Email: 'johndoe1998@fake.email.com',
    Country: 'BR',
    BillingAddress: {
      Street: 'Avenida Brigadeiro Faria Lima',
      City: 'São Paulo',
      State: 'SP',
      ZipCode: '04538-081',
      Country: 'BR'
    },
    ShippingAddress: {
      Street: 'Avenida Brigadeiro Faria Lima',
      City: 'São Paulo',
      State: 'SP',
      ZipCode: '04538-081',
      Country: 'BR'
    }
  },
  OrderCreatedDate: '2025-01-26T20:03:00.000Z',
  PaymentDate: '2025-01-26T20:04:00.000Z',
  RefundDate: null,
  PaymentGateway: 'CreditCard',
  OrderNotes: 'Pagamento confirmado via cartão de crédito. O pedido está em processamento para envio.',
  CouponCode: 'PROMO2025',
  Items: [
    {
      ItemId: 'd9dea3ec-1088-40e5-91e8-bd2fee9a7925',
      ItemName: 'RTX 4090 24 GB',
      Quantity: 1,
      UnitPrice: 12318.99,
      ItemCategory: 'Hardware',
      ItemBrand: 'Nvidia',
      ItemSku: 'NV-4090'
    }
  ],
  ShippingDetails: {
    ShippingMethod: 'Express',
    EstimatedDeliveryDate: '2025-01-28T00:00:00.000Z',
    TrackingNumber: 'TKD9DEA3EC',
    ShippingStatus: 'Pending'
  },
  PaymentDetails: {
    PaymentStatus: 'Paid',
    PaymentMethodDetails: {
      CardType: 'Mastercard',
      Last4Digits: 1234,
      TransactionId: 'CC9876543211'
    }
  }
};

afterEach(() => App.close());

describe('handle', () => {
  it('should call usecase with correct params', async () => {
    jest.spyOn(controller, 'allOffersPaymentMethodToUtmifyPaymentMethod');
    jest.spyOn(controller, 'allOffersStatusToUtmifyTransactionStatus');
    jest.spyOn(controller, 'allOffersItemsToUtmifyProducts');
    jest.spyOn(controller, 'allOffersCustomerToUtmifyCustomer');
    jest.spyOn(controller, 'allOffersBodyToUtmifyValues');
    jest.spyOn(usecase, 'execute').mockResolvedValueOnce();

    const mockedExpressRes = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const res = await controller.handle({ body: test_order } as Request, mockedExpressRes as unknown as Response);

    expect(res).toBe(mockedExpressRes.status(200).send());
    
    expect(controller.allOffersPaymentMethodToUtmifyPaymentMethod).toHaveBeenCalledTimes(1);
    expect(controller.allOffersPaymentMethodToUtmifyPaymentMethod).toHaveBeenCalledWith(test_order.PaymentMethod);
    
    expect(controller.allOffersStatusToUtmifyTransactionStatus).toHaveBeenCalledTimes(1);
    expect(controller.allOffersStatusToUtmifyTransactionStatus).toHaveBeenCalledWith(test_order.SaleStatus);
    
    expect(controller.allOffersItemsToUtmifyProducts).toHaveBeenCalledTimes(1);
    expect(controller.allOffersItemsToUtmifyProducts).toHaveBeenCalledWith(test_order.Items);

    expect(controller.allOffersCustomerToUtmifyCustomer).toHaveBeenCalledTimes(1);
    expect(controller.allOffersCustomerToUtmifyCustomer).toHaveBeenCalledWith(test_order.Customer);

    expect(controller.allOffersBodyToUtmifyValues).toHaveBeenCalledTimes(1);
    expect(controller.allOffersBodyToUtmifyValues).toHaveBeenCalledWith(test_order);

    expect(usecase.execute).toHaveBeenCalledTimes(1);
    expect(usecase.execute).toHaveBeenCalledWith({
      data: {
        saleId: test_order.OrderId.toString(),
        externalWebhookId: test_order.WebhookId,
        platform: UtmifyIntegrationPlatform.AllOffers,
        paymentMethod: UtmifyPaymentMethod.CreditCard,
        transactionStatus: UtmifyTransactionStatus.Paid,
        products: [
          {
            id: 'd9dea3ec-1088-40e5-91e8-bd2fee9a7925',
            name: 'RTX 4090 24 GB',
            quantity: 1,
            priceInCents: 1231899
          }
        ],
        customer: {
          id: 'johndoe1998@fake.email.com',
          fullName: 'John Doe',
          email: 'johndoe1998@fake.email.com',
          phone: '+5545900000000',
          country: 'BR'
        },
        values: {
          totalValueInCents: 1231899,
          sellerValueInCents: 3599,
          platformValueInCents: 3900,
          shippingValueInCents: null
        },
        createdAt: new Date('2025-01-26T20:03:00.000Z'),
        updatedAt: expect.any(Date),
        paidAt: new Date('2025-01-26T20:04:00.000Z'),
        refundedAt: null,
      },
      additionalInfo: {
        currency: 'BRL',
      },
    });

  });
});

describe('allOffersStatusToUtmifyTransactionStatus', () => {
  it('should return correct utmify transaction status', () => {
    expect(controller.allOffersStatusToUtmifyTransactionStatus('AwaitingPayment'))
      .toBe(UtmifyTransactionStatus.Pending);

    expect(controller.allOffersStatusToUtmifyTransactionStatus('Paid'))
      .toBe(UtmifyTransactionStatus.Paid);

    expect(controller.allOffersStatusToUtmifyTransactionStatus('Refunded'))
      .toBe(UtmifyTransactionStatus.Refunded);
  });

  it('should throw request error if method is invalid', () => {
    const status = 'any other' as any;
    try {
      controller.allOffersStatusToUtmifyTransactionStatus(status);
    } catch (e) {
      expect(e).toEqual(new RequestError(400, `Unknown payment status: ${status}`));
    }
  });
});

describe('allOffersPaymentMethodToUtmifyPaymentMethod', () => {
  it('should return correct utmify payment method', () => {
    expect(controller.allOffersPaymentMethodToUtmifyPaymentMethod('Boleto'))
      .toBe(UtmifyPaymentMethod.Billet);

    expect(controller.allOffersPaymentMethodToUtmifyPaymentMethod('CreditCard'))
      .toBe(UtmifyPaymentMethod.CreditCard);

    expect(controller.allOffersPaymentMethodToUtmifyPaymentMethod('Pix'))
      .toBe(UtmifyPaymentMethod.Pix);
  });

  it('should throw request error if payment method is invalid', () => {
    const status = 'any other' as any;
    try {
      controller.allOffersPaymentMethodToUtmifyPaymentMethod(status);
    } catch (e) {
      expect(e).toEqual(new RequestError(400, `Unknown payment method: ${status}`));
    }
  });
});

describe('allOffersItemsToUtmifyProducts', () => {
  it.each([
    [
      [
        {
          ItemId: 'd9dea3ec-1088-40e5-91e8-bd2fee9a7925',
          ItemName: 'RTX 4090 24 GB',
          Quantity: 1,
          UnitPrice: 12318.99,
          ItemCategory: 'Hardware',
          ItemBrand: 'Nvidia',
          ItemSku: 'NV-4090'
        },
        {
          ItemId: 'a20752c7-d422-4a17-8b82-b196690b3033',
          ItemName: 'Ryzen Threadripper Pro 7995WX SP6',
          Quantity: 1,
          UnitPrice: 80039.00,
          ItemCategory: 'Hardware',
          ItemBrand: 'AMD',
          ItemSku: 'AM-7995'
        },
        {
          ItemId: '22737395-558b-4f9c-84fd-b92712fc87b7',
          ItemName: 'PC Case Fan 8000',
          Quantity: 6,
          UnitPrice: 100.00,
          ItemCategory: 'Hardware',
          ItemBrand: 'Generic',
          ItemSku: 'GN-8000'
        }
      ],
      [
        {
          id: 'd9dea3ec-1088-40e5-91e8-bd2fee9a7925',
          name: 'RTX 4090 24 GB',
          priceInCents: 1231899,
          quantity: 1,
        },
        {
          id: 'a20752c7-d422-4a17-8b82-b196690b3033',
          name: 'Ryzen Threadripper Pro 7995WX SP6',
          priceInCents: 8003900,
          quantity: 1,
        },
        {
          id: '22737395-558b-4f9c-84fd-b92712fc87b7',
          name: 'PC Case Fan 8000',
          priceInCents: 10000,
          quantity: 6,
        }
      ]
    ]
  ])('should return correct utmify products', (input, expected) => {
    expect(controller.allOffersItemsToUtmifyProducts(input))
      .toEqual(expected);
  });
});

describe('allOffersCustomerToUtmifyCustomer', () => {
  it.each([
    [
      {
        FirstName: 'John',
        LastName: 'Doe',
        Phone: '+5545900000000',
        Email: 'johndoe1998@fake.email.com',
        Country: 'BR',
        BillingAddress: {
          Street: 'Avenida Brigadeiro Faria Lima',
          City: 'São Paulo',
          State: 'SP',
          ZipCode: '04538-081',
          Country: 'BR'
        },
        ShippingAddress: {
          Street: 'Avenida Brigadeiro Faria Lima',
          City: 'São Paulo',
          State: 'SP',
          ZipCode: '04538-081',
          Country: 'BR'
        }
      },
      {
        id: 'johndoe1998@fake.email.com',
        fullName: 'John Doe',
        email: 'johndoe1998@fake.email.com',
        phone: '+5545900000000',
        country: 'BR'
      }
    ],
    [
      {
        FirstName: 'Janet',
        LastName: 'Doe',
        Phone: '+17180000000',
        Email: 'janetdoe1984@fake.email.com',
        Country: 'US',
        BillingAddress: {
          Street: '42nd Street',
          City: 'New York',
          State: 'NY',
          ZipCode: '10036',
          Country: 'US'
        },
        ShippingAddress: {
          Street: '42nd Street',
          City: 'New York',
          State: 'NY',
          ZipCode: '10036',
          Country: 'US'
        }
      },
      {
        id: 'janetdoe1984@fake.email.com',
        fullName: 'Janet Doe',
        email: 'janetdoe1984@fake.email.com',
        phone: '+17180000000',
        country: 'US'
      }
    ]
  ])('should return correct utmify customers', (input, expected) => {
    expect(controller.allOffersCustomerToUtmifyCustomer(input))
      .toEqual(expected);
  });
});

describe('allOffersBodyToUtmifyValues', () => {
  it('should return correct utmify values in BRL', () => {
    const order = {
      ...test_order,
      UserCommission: 35.99,
      TotalSaleAmount: 12318.99,
      PlatformCommission: 39.00,
      Currency: 'BRL',
    } as AllOffersBody;

    expect(controller.allOffersBodyToUtmifyValues(order))
      .toEqual({
        totalValueInCents: 100 * order.TotalSaleAmount,
        sellerValueInCents: 100 * order.UserCommission,
        platformValueInCents: 100 * order.PlatformCommission,
        shippingValueInCents: null,
      } as UtmifyValues);
  });

  it('should return correct utmify values in some another currency', () => {
    const order = {
      ...test_order,
      UserCommission: 50,
      TotalSaleAmount: 180,
      PlatformCommission: 89,
      Currency: 'USD',
    } as AllOffersBody;
    
    expect(controller.allOffersBodyToUtmifyValues(order))
      .toEqual({
        totalValueInCents: expect.any(Number),
        sellerValueInCents: expect.any(Number),
        platformValueInCents: expect.any(Number),
        shippingValueInCents: null,
      });
  });
});