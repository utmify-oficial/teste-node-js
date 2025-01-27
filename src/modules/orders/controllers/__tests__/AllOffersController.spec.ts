import { RequestError } from '../../../../core/errors/RequestError';
import { UtmifyOrdersRepositoryMongoose } from '../../repositories/implementations/UtmifyOrdersRepositoryMongoose';
import { UtmifyCustomer } from '../../types/UtmifyCustomer';
import { UtmifyPaymentMethod } from '../../types/UtmifyPaymentMethod';
import { UtmifyProduct } from '../../types/UtmifyProduct';
import { UtmifyTransactionStatus } from '../../types/UtmifyTransactionStatus';
import { UtmifyValues } from '../../types/UtmifyValues';
import { SaveUtmifyOrderUseCase, SaveUtmifyOrderUseCaseInput } from '../../usecases/SaveUtmifyOrderUseCase';
import { App } from '../../../../server/App';
import { UtmifyIntegrationPlatform } from '../../types/UtmifyIntegrationPlatform';
import { Request, Response } from 'express';
import { AllOffersBody, AllOffersController, AllOffersCustomer, AllOffersItem } from '../AllOffersController';
import { ConvertOrderCurrencyAction } from '../../actions/ConvertOrderCurrencyAction';

const repository = new UtmifyOrdersRepositoryMongoose();
const usecase = new SaveUtmifyOrderUseCase(repository);
const currencyAction = new ConvertOrderCurrencyAction();
const controller = new AllOffersController(usecase, currencyAction);

afterEach(() => App.close());

describe('handle', () => {
  it('should call usecase with correct params', async () => {
    const body: AllOffersBody = {
      WebhookId: "webhook_66778",
      OrderId: "9988221144",
      PaymentMethod: "CreditCard",
      UserCommission: 30.00,
      TotalSaleAmount: 300.00,
      PlatformCommission: 40.00,
      Currency: "BRL",
      SaleStatus: "Paid",
      Customer: {
        FirstName: "Sophie",
        LastName: "Müller",
        Phone: "+4915123456789",
        Email: "sophie.muller@example.com",
        Country: "DE",
        BillingAddress: {
          Street: "Hauptstraße 25",
          City: "Berlin",
          State: "BE",
          ZipCode: "10115",
          Country: "DE"
        },
        ShippingAddress: {
          Street: "Schönhauser Allee 45",
          City: "Berlin",
          State: "BE",
          ZipCode: "10435",
          Country: "DE"
        }
      },
      OrderCreatedDate: "2025-01-23T15:30:00Z",
      PaymentDate: "2025-01-23T16:00:00Z",
      RefundDate: null,
      PaymentGateway: "CreditCard",
      OrderNotes: "Pagamento confirmado via cartão de crédito.",
      CouponCode: "NEWYEAR20",
      Items: [
        {
          ItemId: "prod_789",
          ItemName: "Wireless Keyboard",
          Quantity: 1,
          UnitPrice: 100.00,
          ItemCategory: "Electronics",
          ItemBrand: "KeyWorks",
          ItemSku: "WK-00123"
        },
        {
          ItemId: "prod_890",
          ItemName: "Ergonomic Mouse",
          Quantity: 2,
          UnitPrice: 100.00,
          ItemCategory: "Electronics",
          ItemBrand: "MousePro",
          ItemSku: "EM-04567"
        }
      ],
      ShippingDetails: {
        ShippingMethod: "Express",
        EstimatedDeliveryDate: "2025-01-26T10:00:00Z",
        TrackingNumber: "TRK12345678",
        ShippingStatus: "Shipped"
      },
      PaymentDetails: {
        PaymentStatus: "Paid",
        PaymentMethodDetails: {
          CardType: "Visa",
          Last4Digits: "1234",
          TransactionId: "CC9876543210"
        }
      }
    };

    const mockedMethod = UtmifyPaymentMethod.Pix;
    jest.spyOn(controller, 'allOffersPaymentMethodToUtmifyPaymentMethod').mockReturnValueOnce(mockedMethod);

    const mockedStatus = UtmifyTransactionStatus.Paid;
    jest.spyOn(controller, 'allOffersStatusToUtmifyTransactionStatus').mockReturnValueOnce(mockedStatus);

    const mockedProducts: UtmifyProduct[] = [];
    jest.spyOn(controller, 'allOffersProductsToUtmifyProducts').mockReturnValueOnce(mockedProducts);

    const mockedCustomer: UtmifyCustomer = {
      country: 'country',
      email: 'email',
      fullName: 'fullName',
      id: 'id',
      phone: 'phone',
    };
    jest.spyOn(controller, 'allOffersCustomerToUtmifyCustomer').mockReturnValueOnce(mockedCustomer);

    const mockedValues: UtmifyValues = {
      platformValueInCents: 0,
      sellerValueInCents: 0,
      shippingValueInCents: 0,
      totalValueInCents: 0,
    };
    jest.spyOn(controller, 'allOffersBodyToUtmifyValues').mockReturnValueOnce(mockedValues);

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
        platform: UtmifyIntegrationPlatform.AllOffers,
        paymentMethod: mockedMethod,
        transactionStatus: mockedStatus,
        products: mockedProducts,
        customer: mockedCustomer,
        values: mockedValues,
        createdAt: new Date(body.OrderCreatedDate),
        updatedAt: expect.any(Date),
        paidAt: body.PaymentDate ? new Date(body.PaymentDate) : null,
        refundedAt: null,
      },
      additionalInfo: {
        currency: body.Currency,
      },
    } as SaveUtmifyOrderUseCaseInput);

    expect(controller.allOffersPaymentMethodToUtmifyPaymentMethod)
      .toHaveBeenCalledWith(body.PaymentMethod);
    expect(controller.allOffersStatusToUtmifyTransactionStatus).toHaveBeenCalledWith(body.PaymentDetails.PaymentStatus);
    expect(controller.allOffersProductsToUtmifyProducts).toHaveBeenCalledWith(body.Items, 1);
    expect(controller.allOffersCustomerToUtmifyCustomer).toHaveBeenCalledWith(body.Customer);
    expect(controller.allOffersBodyToUtmifyValues).toHaveBeenCalledWith(body, 1);
  });
});

describe('allOffersPaymentMethodToUtmifyPaymentMethod', () => {
  it('should return correct utmify payment method', () => {
    expect(controller.allOffersPaymentMethodToUtmifyPaymentMethod('Pix'))
      .toBe(UtmifyPaymentMethod.Pix);

    expect(controller.allOffersPaymentMethodToUtmifyPaymentMethod('Boleto'))
      .toBe(UtmifyPaymentMethod.Billet);

    expect(controller.allOffersPaymentMethodToUtmifyPaymentMethod('CreditCard'))
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
    expect(controller.allOffersStatusToUtmifyTransactionStatus('Pending'))
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

describe('allOffersProductsToUtmifyProducts', () => {
  it('should return correct utmify products', () => {
    const allOffersProducts: AllOffersItem[] = [
      {
        ItemId: "prod_789",
        ItemName: "Wireless Keyboard",
        Quantity: 1,
        UnitPrice: 100.00,
        ItemCategory: "Electronics",
        ItemBrand: "KeyWorks",
        ItemSku: "WK-00123"
      },
      {
        ItemId: "prod_890",
        ItemName: "Ergonomic Mouse",
        Quantity: 2,
        UnitPrice: 100.00,
        ItemCategory: "Electronics",
        ItemBrand: "MousePro",
        ItemSku: "EM-04567"
      }
    ];

    expect(controller.allOffersProductsToUtmifyProducts(allOffersProducts, 1)).toEqual([
      {
        id: 'prod_789',
        name: 'Wireless Keyboard',
        priceInCents: 100 * 100.00,
        quantity: 1,
      },
      {
        id: 'prod_890',
        name: 'Ergonomic Mouse',
        priceInCents: 100 * 100.00,
        quantity: 2,
      },
    ] as UtmifyProduct[]);
  });
});

describe('allOffersCustomerToUtmifyCustomer', () => {
  it('should return correct utmify customer', () => {
    const allOffersCustomer: AllOffersCustomer = {
      FirstName: "Sophie",
      LastName: "Müller",
      Phone: "+4915123456789",
      Email: "sophie.muller@example.com",
      Country: "DE",
      BillingAddress: {
        Street: "Hauptstraße 25",
        City: "Berlin",
        State: "BE",
        ZipCode: "10115",
        Country: "DE"
      },
      ShippingAddress: {
        Street: "Schönhauser Allee 45",
        City: "Berlin",
        State: "BE",
        ZipCode: "10435",
        Country: "DE"
      }
    };

    expect(controller.allOffersCustomerToUtmifyCustomer(allOffersCustomer)).toEqual({
      id: allOffersCustomer.Email,
      fullName: allOffersCustomer.FirstName + ' ' + allOffersCustomer.LastName,
      email: allOffersCustomer.Email,
      phone: allOffersCustomer.Phone,
      country: allOffersCustomer.Country,
    } as UtmifyCustomer);
  });
});

describe('allOffersBodyToUtmifyValues', () => {
  it('should return correct utmify values', () => {
    const body: AllOffersBody = {
      WebhookId: "webhook_66778",
      OrderId: "9988221144",
      PaymentMethod: "CreditCard",
      UserCommission: 30.00,
      TotalSaleAmount: 300.00,
      PlatformCommission: 40.00,
      Currency: "EUR",
      SaleStatus: "Paid",
      Customer: {
        FirstName: "Sophie",
        LastName: "Müller",
        Phone: "+4915123456789",
        Email: "sophie.muller@example.com",
        Country: "DE",
        BillingAddress: {
          Street: "Hauptstraße 25",
          City: "Berlin",
          State: "BE",
          ZipCode: "10115",
          Country: "DE"
        },
        ShippingAddress: {
          Street: "Schönhauser Allee 45",
          City: "Berlin",
          State: "BE",
          ZipCode: "10435",
          Country: "DE"
        }
      },
      OrderCreatedDate: "2025-01-23T15:30:00Z",
      PaymentDate: "2025-01-23T16:00:00Z",
      RefundDate: null,
      PaymentGateway: "CreditCard",
      OrderNotes: "Pagamento confirmado via cartão de crédito.",
      CouponCode: "NEWYEAR20",
      Items: [
        {
          ItemId: "prod_789",
          ItemName: "Wireless Keyboard",
          Quantity: 1,
          UnitPrice: 100.00,
          ItemCategory: "Electronics",
          ItemBrand: "KeyWorks",
          ItemSku: "WK-00123"
        },
        {
          ItemId: "prod_890",
          ItemName: "Ergonomic Mouse",
          Quantity: 2,
          UnitPrice: 100.00,
          ItemCategory: "Electronics",
          ItemBrand: "MousePro",
          ItemSku: "EM-04567"
        }
      ],
      ShippingDetails: {
        ShippingMethod: "Express",
        EstimatedDeliveryDate: "2025-01-26T10:00:00Z",
        TrackingNumber: "TRK12345678",
        ShippingStatus: "Shipped"
      },
      PaymentDetails: {
        PaymentStatus: "Paid",
        PaymentMethodDetails: {
          CardType: "Visa",
          Last4Digits: "1234",
          TransactionId: "CC9876543210"
        }
      }
    };

    expect(controller.allOffersBodyToUtmifyValues(body, 1)).toEqual({
      totalValueInCents: 100 * body.TotalSaleAmount,
      sellerValueInCents: 100 * body.UserCommission,
      platformValueInCents: 100 * body.PlatformCommission,
      shippingValueInCents: 100 * 0,
    } as UtmifyValues);
  });
});
