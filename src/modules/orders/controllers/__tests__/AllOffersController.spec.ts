import { Request, Response } from 'express';
import { AllOffersController } from '../AllOffersController';
import { SaveUtmifyOrderUseCase } from '../../usecases/SaveUtmifyOrderUseCase';
import { UtmifyOrdersRepositoryMongoose } from '../../repositories/implementations/UtmifyOrdersRepositoryMongoose';
import { UtmifyPaymentMethod } from '../../types/UtmifyPaymentMethod';
import { UtmifyTransactionStatus } from '../../types/UtmifyTransactionStatus';
import { UtmifyProduct } from '../../types/UtmifyProduct';
import { UtmifyCustomer } from '../../types/UtmifyCustomer';
import { UtmifyValues } from '../../types/UtmifyValues';
import { UtmifyIntegrationPlatform } from '../../types/UtmifyIntegrationPlatform';
import { ConvertOrderCurrencyAction } from '../../actions/ConvertOrderCurrencyAction';
import { RequestError } from '../../../../core/errors/RequestError';

const repository = new UtmifyOrdersRepositoryMongoose();
const usecase = new SaveUtmifyOrderUseCase(repository);
const convertOrderCurrencyAction = new ConvertOrderCurrencyAction();
const controller = new AllOffersController(usecase, convertOrderCurrencyAction);

describe('AllOffersController', () => {
  it('should handle a valid AllOffers order', async () => {
    const body = {
      WebhookId: '12345',
      OrderId: '67890',
      PaymentMethod: 'pix',
      UserCommission: 100,
      TotalSaleAmount: 500,
      PlatformCommission: 50,
      Currency: 'USD',
      SaleStatus: 'paid',
      Customer: {
        CustomerId: 'cust123',
        FirstName: 'John',
        LastName: 'Doe',
        Phone: '123456789',
        Email: 'john.doe@example.com',
        Country: 'BR',
      },
      OrderCreatedDate: '2023-10-01T00:00:00Z',
      PaymentDate: '2023-10-02T00:00:00Z',
      RefundDate: null,
      Items: [
        {
          ItemId: 'item123',
          ItemName: 'Product 1',
          Quantity: 1,
          UnitPrice: 500,
        },
      ],
      ShippingDetails: {
        ShippingMethod: 'standard',
        EstimatedDeliveryDate: '2023-10-10T00:00:00Z',
        TrackingNumber: 'track123',
        ShippingStatus: 'shipped',
        ShippingFee: 10,
      },
    };

    const mockedMethod = UtmifyPaymentMethod.Pix;
    jest.spyOn(controller, 'allOffersPaymentMethodToUtmifyPaymentMethod').mockReturnValueOnce(mockedMethod);

    const mockedStatus = UtmifyTransactionStatus.Paid;
    jest.spyOn(controller, 'allOffersStatusToUtmifyTransactionStatus').mockReturnValueOnce(mockedStatus);

    const mockedProducts: UtmifyProduct[] = [];
    jest.spyOn(controller, 'allOffersProductsToUtmifyProducts').mockReturnValueOnce(mockedProducts);

    const mockedCustomer: UtmifyCustomer = {
      country: 'BR',
      email: 'john.doe@example.com',
      fullName: 'John Doe',
      id: 'cust123',
      phone: '123456789',
    };
    jest.spyOn(controller, 'allOffersCustomerToUtmifyCustomer').mockReturnValueOnce(mockedCustomer);

    const mockedValues: UtmifyValues = {
      platformValueInCents: 0,
      sellerValueInCents: 0,
      shippingValueInCents: 0,
      totalValueInCents: 0,
    };
    jest.spyOn(controller, 'allOffersBodyToUtmifyValues').mockResolvedValueOnce(mockedValues);

    jest.spyOn(usecase, 'execute').mockResolvedValueOnce();

    const mockedExpressRes = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const res = await controller.handle({ body } as Request, mockedExpressRes as unknown as Response);

    expect(res).toBe(mockedExpressRes.status(200).send());

    expect(controller.allOffersPaymentMethodToUtmifyPaymentMethod).toHaveBeenCalledTimes(1);
    expect(controller.allOffersStatusToUtmifyTransactionStatus).toHaveBeenCalledTimes(1);
    expect(controller.allOffersProductsToUtmifyProducts).toHaveBeenCalledTimes(1);
    expect(controller.allOffersCustomerToUtmifyCustomer).toHaveBeenCalledTimes(1);
    expect(controller.allOffersBodyToUtmifyValues).toHaveBeenCalledTimes(1);
    expect(usecase.execute).toHaveBeenCalledTimes(1);

    expect(usecase.execute).toHaveBeenCalledWith({
      data: {
        saleId: body.OrderId,
        externalWebhookId: body.WebhookId,
        platform: UtmifyIntegrationPlatform.WorldMarket,
        paymentMethod: mockedMethod,
        transactionStatus: mockedStatus,
        products: mockedProducts,
        customer: mockedCustomer,
        values: mockedValues,
        createdAt: new Date(body.OrderCreatedDate),
        updatedAt: expect.any(Date),
        paidAt: new Date(body.PaymentDate),
        refundedAt: null,
      },
      additionalInfo: {
        currency: body.Currency,
      },
    });

    expect(controller.allOffersPaymentMethodToUtmifyPaymentMethod)
      .toHaveBeenCalledWith(body.PaymentMethod);
    expect(controller.allOffersStatusToUtmifyTransactionStatus).toHaveBeenCalledWith(body.SaleStatus);
    expect(controller.allOffersProductsToUtmifyProducts).toHaveBeenCalledWith(body.Items);
    expect(controller.allOffersCustomerToUtmifyCustomer).toHaveBeenCalledWith(body.Customer);
    expect(controller.allOffersBodyToUtmifyValues).toHaveBeenCalledWith(body);
  });
});

describe('allOffersPaymentMethodToUtmifyPaymentMethod', () => {
  it('should return correct utmify payment method', () => {
    expect(controller.allOffersPaymentMethodToUtmifyPaymentMethod('pix'))
      .toBe(UtmifyPaymentMethod.Pix);

    expect(controller.allOffersPaymentMethodToUtmifyPaymentMethod('boleto'))
      .toBe(UtmifyPaymentMethod.Billet);

    expect(controller.allOffersPaymentMethodToUtmifyPaymentMethod('creditcard'))
      .toBe(UtmifyPaymentMethod.CreditCard);
  });

  it('should throw request error if method is invalid', () => {
    const method = 'any other' as any;

    try {
      controller.allOffersPaymentMethodToUtmifyPaymentMethod(method);
    } catch (e) {
      expect(e).toEqual(new RequestError(400, `Unknown payment method: ${method}`));
    }
  });
});

describe('allOffersStatusToUtmifyTransactionStatus', () => {
  it('should return correct utmify transaction status', () => {
    expect(controller.allOffersStatusToUtmifyTransactionStatus('awaitingpayment'))
      .toBe(UtmifyTransactionStatus.Pending);

    expect(controller.allOffersStatusToUtmifyTransactionStatus('paid'))
      .toBe(UtmifyTransactionStatus.Paid);

    expect(controller.allOffersStatusToUtmifyTransactionStatus('refunded'))
      .toBe(UtmifyTransactionStatus.Refunded);
  });

  it('should throw request error if status is invalid', () => {
    const status = 'any other' as any;

    try {
      controller.allOffersStatusToUtmifyTransactionStatus(status);
    } catch (e) {
      expect(e).toEqual(new RequestError(400, `Unknown sale status: ${status}`));
    }
  });
});

describe('allOffersProductsToUtmifyProducts', () => {
  it('should return correct utmify products', () => {
    const allOffersProducts = [
      {
        ItemId: 'item123',
        ItemName: 'Product 1',
        Quantity: 1,
        UnitPrice: 500,
      },
      {
        ItemId: 'item124',
        ItemName: 'Product 2',
        Quantity: 2,
        UnitPrice: 300,
      },
    ];

    expect(controller.allOffersProductsToUtmifyProducts(allOffersProducts)).toEqual([
      {
        id: 'item123',
        name: 'Product 1',
        priceInCents: 50000,
        quantity: 1,
      },
      {
        id: 'item124',
        name: 'Product 2',
        priceInCents: 30000,
        quantity: 2,
      },
    ] as UtmifyProduct[]);
  });
});

describe('allOffersCustomerToUtmifyCustomer', () => {
  it('should return correct utmify customer', () => {
    const allOffersCustomer = {
      CustomerId: 'cust123',
      FirstName: 'John',
      LastName: 'Doe',
      Phone: '123456789',
      Email: 'john.doe@example.com',
      Country: 'BR',
    };

    expect(controller.allOffersCustomerToUtmifyCustomer(allOffersCustomer)).toEqual({
      id: allOffersCustomer.CustomerId,
      fullName: `${allOffersCustomer.FirstName} ${allOffersCustomer.LastName}`,
      email: allOffersCustomer.Email,
      phone: allOffersCustomer.Phone,
      country: allOffersCustomer.Country,
    } as UtmifyCustomer);
  });
});