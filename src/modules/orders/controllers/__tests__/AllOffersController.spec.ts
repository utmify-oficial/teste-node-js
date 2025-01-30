/* eslint-disable max-len */
import { UtmifyCustomer } from '../../types/UtmifyCustomer';
import { UtmifyPaymentMethod } from '../../types/UtmifyPaymentMethod';
import { UtmifyProduct } from '../../types/UtmifyProduct';
import { UtmifyTransactionStatus } from '../../types/UtmifyTransactionStatus';
import { AllOffersBody, AllOffersController, AllOffersCustomer, AllOffersPaymentMethod, AllOffersSaleStatus } from '../AllOffersController';
import { UtmifyValues } from '../../types/UtmifyValues';
import { UtmifyOrdersRepositoryMongoose } from '../../repositories/implementations/UtmifyOrdersRepositoryMongoose';
import { SaveUtmifyOrderUseCase, SaveUtmifyOrderUseCaseInput } from '../../usecases/SaveUtmifyOrderUseCase';
import { GetOrderTransactionStatusUseCase } from '../../usecases/GetOrderTransactionStatusUseCase';
import { ConvertOrderCurrencyAction } from '../../actions/ConvertOrderCurrencyAction';
import { AxiosAdapter } from '../../../../http/AxiosAdapter';
import { App } from '../../../../server/App';
import { Request, Response } from 'express';
import { UtmifyIntegrationPlatform } from '../../types/UtmifyIntegrationPlatform';
import { RequestError } from '../../../../core/errors/RequestError';

const httpClient = new AxiosAdapter();
const repository = new UtmifyOrdersRepositoryMongoose();
const saveUtmifyOrderUseCase = new SaveUtmifyOrderUseCase(repository);
const getOrderTransactionStatusUseCase = new GetOrderTransactionStatusUseCase(repository);
const convertOrderCurrencyAction = new ConvertOrderCurrencyAction(httpClient);
const controller = new AllOffersController(saveUtmifyOrderUseCase, getOrderTransactionStatusUseCase, convertOrderCurrencyAction);

afterEach(() => App.close());

describe('handle', function() {
  it('should call usecase with correct params', async function() {
    const body: AllOffersBody = {
      WebhookId: 'webhook_44556',
      OrderId: '9988776655',
      PaymentMethod: 'Boleto',
      UserCommission: 75.00,
      TotalSaleAmount: 750.00,
      PlatformCommission: 90.00,
      Currency: 'BRL',
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

    const mockedPaymentMethod = UtmifyPaymentMethod.Billet;
    jest.spyOn(controller, 'allOffersPaymentMethodToUtmifyPaymentMethod').mockReturnValueOnce(mockedPaymentMethod);

    const mockedTransactionStatus = UtmifyTransactionStatus.Pending;
    jest.spyOn(controller, 'allOffersSaleStatusToUtmifyTransactionStatus').mockReturnValueOnce(mockedTransactionStatus);

    const mockedProducts: UtmifyProduct[] = [];
    jest.spyOn(controller, 'allOffersBodyToUtmifyProduct').mockResolvedValueOnce(mockedProducts);

    const mockedCustomer: UtmifyCustomer = {
      id: 'email',
      fullName: 'fullName',
      email: 'email',
      phone: 'phone',
      country: 'country',
    };
    jest.spyOn(controller, 'allOffersCustomerToUtmifyCustomer').mockReturnValueOnce(mockedCustomer);

    const mockedValues: UtmifyValues = {
      totalValueInCents: 0,
      sellerValueInCents: 0,
      shippingValueInCents: 0,
      platformValueInCents: 0,
    };
    jest.spyOn(controller, 'allOffersBodyToUtmifyValues').mockResolvedValueOnce(mockedValues);

    jest.spyOn(controller, 'isValidStatusTransition').mockReturnValueOnce(true);

    jest.spyOn(convertOrderCurrencyAction, 'execute').mockResolvedValueOnce(0);

    jest.spyOn(getOrderTransactionStatusUseCase, 'execute').mockResolvedValueOnce({
      transactionStatus: UtmifyTransactionStatus.Pending,
    });

    jest.spyOn(saveUtmifyOrderUseCase, 'execute').mockResolvedValueOnce();

    const mockedExpressRes = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const res = await controller.handle({ body } as Request, mockedExpressRes as unknown as Response);

    expect(res).toBe(mockedExpressRes.status(200).send());

    expect(controller.allOffersPaymentMethodToUtmifyPaymentMethod).toHaveBeenCalledTimes(1);
    expect(controller.allOffersSaleStatusToUtmifyTransactionStatus).toHaveBeenCalledTimes(1);
    expect(controller.allOffersBodyToUtmifyProduct).toHaveBeenCalledTimes(1);
    expect(controller.allOffersCustomerToUtmifyCustomer).toHaveBeenCalledTimes(1);
    expect(controller.allOffersBodyToUtmifyValues).toHaveBeenCalledTimes(1);
    expect(controller.isValidStatusTransition).toHaveBeenCalledTimes(1);
    expect(getOrderTransactionStatusUseCase.execute).toHaveBeenCalledTimes(1);
    expect(saveUtmifyOrderUseCase.execute).toHaveBeenCalledTimes(1);

    expect(saveUtmifyOrderUseCase.execute).toHaveBeenCalledWith({
      data: {
        saleId: body.OrderId,
        externalWebhookId: body.WebhookId,
        platform: UtmifyIntegrationPlatform.AllOffers,
        paymentMethod: mockedPaymentMethod,
        transactionStatus: mockedTransactionStatus,
        products: mockedProducts,
        customer: mockedCustomer,
        values: mockedValues,
        createdAt: new Date(body.OrderCreatedDate),
        updatedAt: expect.any(Date),
        paidAt: null,
        refundedAt: null,
      },
      additionalInfo: {
        currency: body.Currency,
      },
    } as SaveUtmifyOrderUseCaseInput);

    expect(controller.allOffersPaymentMethodToUtmifyPaymentMethod).toHaveBeenCalledWith(body.PaymentMethod);
    expect(controller.allOffersSaleStatusToUtmifyTransactionStatus).toHaveBeenCalledWith(body.SaleStatus);
    expect(controller.allOffersBodyToUtmifyProduct).toHaveBeenCalledWith(body);
    expect(controller.allOffersCustomerToUtmifyCustomer).toHaveBeenCalledWith(body.Customer);
    expect(controller.allOffersBodyToUtmifyValues).toHaveBeenCalledWith(body);
  });

  it('should throw an error if transition status is invalid', async function() {
    const body: AllOffersBody = {
      WebhookId: 'webhook_44556',
      OrderId: '9988776655',
      PaymentMethod: 'Boleto',
      UserCommission: 75.00,
      TotalSaleAmount: 750.00,
      PlatformCommission: 90.00,
      Currency: 'BRL',
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

    jest.spyOn(controller, 'isValidStatusTransition').mockReturnValueOnce(false);
    jest.spyOn(getOrderTransactionStatusUseCase, 'execute').mockResolvedValueOnce({
      transactionStatus: UtmifyTransactionStatus.Paid,
    });

    const mockedExpressRes = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await expect(() => controller.handle({ body } as Request, mockedExpressRes as unknown as Response)).rejects.toThrow(new RequestError(400, 'Invalid status transition'));
  });
});

describe('allOffersPaymentMethodToUtmifyPaymentMethod', function() {
  it('should return correct utmify payment method', function() {
    expect(controller.allOffersPaymentMethodToUtmifyPaymentMethod('Pix')).toEqual(UtmifyPaymentMethod.Pix);
    expect(controller.allOffersPaymentMethodToUtmifyPaymentMethod('Boleto')).toEqual(UtmifyPaymentMethod.Billet);
    expect(controller.allOffersPaymentMethodToUtmifyPaymentMethod('CreditCard')).toEqual(UtmifyPaymentMethod.CreditCard);
  });

  it.each(['DebitCard', 'TED', 'NFC', 'Bitcoin'])('should throw error if is a invalid payment method', function(method: string) {
    expect(() => controller.allOffersPaymentMethodToUtmifyPaymentMethod(method as AllOffersPaymentMethod)).toThrow(new RequestError(400, `Unknown payment method: ${method}`));
  });
});

describe('allOffersSaleStatusToUtmifyTransactionStatus', function() {
  it('should return correct utmify transaction status', function() {
    expect(controller.allOffersSaleStatusToUtmifyTransactionStatus('AwaitingPayment')).toEqual(UtmifyTransactionStatus.Pending);
    expect(controller.allOffersSaleStatusToUtmifyTransactionStatus('Paid')).toEqual(UtmifyTransactionStatus.Paid);
    expect(controller.allOffersSaleStatusToUtmifyTransactionStatus('Refunded')).toEqual(UtmifyTransactionStatus.Refunded);
  });

  it.each(['Approved', 'Rejected', 'Reversed'])('should throw error if is a invalid transaction status', function(status: string) {
    expect(() => controller.allOffersSaleStatusToUtmifyTransactionStatus(status as AllOffersSaleStatus)).toThrow(new RequestError(400, `Unknown payment status: ${status}`));
  });
});

describe('allOffersBodyToUtmifyProduct', function() {
  it('should return correct utmify products', async function() {
    const body = {
      Currency: 'BRL',
      OrderCreatedDate: '2024-01-30T03:00:00Z',
      Items: [
        { ItemId: 'prod_123', ItemName: 'Headphones', Quantity: 2, UnitPrice: 10 },
        { ItemId: 'prod_456', ItemName: 'Smartphone', Quantity: 1, UnitPrice: 20 },
      ],
    } as AllOffersBody;

    await expect(controller.allOffersBodyToUtmifyProduct(body)).resolves.toEqual([
      { id: 'prod_123', name: 'Headphones', quantity: 2, priceInCents: 10 * 100 },
      { id: 'prod_456', name: 'Smartphone', quantity: 1, priceInCents: 20 * 100 },
    ]);
  });
});

describe('allOffersCustomerToUtmifyCustomer', function() {
  it('should return correct utmify customer', function() {
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

    expect(controller.allOffersCustomerToUtmifyCustomer(allOffersCustomer)).toEqual({
      id: allOffersCustomer.Email,
      fullName: `${allOffersCustomer.FirstName} ${allOffersCustomer.LastName}`,
      email: allOffersCustomer.Email,
      country: allOffersCustomer.Country,
      phone: allOffersCustomer.Phone,
    } as UtmifyCustomer);
  });
});

describe('allOffersBodyToUtmifyValues', function() {
  it('should return correct utmify values', async function() {
    const body = {
      Currency: 'USD',
      OrderCreatedDate: '2025-01-24T03:00:00Z',
      TotalSaleAmount: 100,
      UserCommission: 25,
      PlatformCommission: 50,
    } as AllOffersBody;

    const mockedValues: UtmifyValues = {
      totalValueInCents: 10000,
      sellerValueInCents: 2500,
      shippingValueInCents: null,
      platformValueInCents: 5000,
    };
    jest.spyOn(controller, 'allOffersBodyToUtmifyValues').mockResolvedValueOnce(mockedValues);

    await expect(controller.allOffersBodyToUtmifyValues(body)).resolves.toEqual({
      totalValueInCents: 100 * 100,
      sellerValueInCents: 25 * 100,
      platformValueInCents: 50 * 100,
      shippingValueInCents: null,
    } as UtmifyValues);
  });

  it('should not convert if the currency is BRL', async function() {
    const body = {
      Currency: 'BRL',
      OrderCreatedDate: '2025-01-24T03:00:00Z',
      TotalSaleAmount: 100,
      UserCommission: 25,
      PlatformCommission: 50,
    } as AllOffersBody;

    await expect(controller.allOffersBodyToUtmifyValues(body)).resolves.toEqual({
      totalValueInCents: 100 * 100,
      sellerValueInCents: 25 * 100,
      platformValueInCents: 50 * 100,
      shippingValueInCents: null,
    } as UtmifyValues);
  });
});

describe('isValidStatusTransition', function() {
  it('should return true if the status transition is valid', function() {
    expect(controller.isValidStatusTransition(UtmifyTransactionStatus.Pending, UtmifyTransactionStatus.Paid)).toBeTruthy();
    expect(controller.isValidStatusTransition(UtmifyTransactionStatus.Pending, UtmifyTransactionStatus.Refunded)).toBeTruthy();
  });

  it('should return false if the status transition is invalid', function() {
    expect(controller.isValidStatusTransition(UtmifyTransactionStatus.Paid, UtmifyTransactionStatus.Pending)).toBeFalsy();
    expect(controller.isValidStatusTransition(UtmifyTransactionStatus.Refunded, UtmifyTransactionStatus.Pending)).toBeFalsy();
    expect(controller.isValidStatusTransition(UtmifyTransactionStatus.Refunded, UtmifyTransactionStatus.Paid)).toBeFalsy();
  });
});
