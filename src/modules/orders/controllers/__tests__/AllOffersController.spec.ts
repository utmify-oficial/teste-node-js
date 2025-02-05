import { RequestError } from "../../../../core/errors/RequestError";
import { UtmifyOrdersRepositoryMongoose } from "../../repositories/implementations/UtmifyOrdersRepositoryMongoose";
import { UtmifyCustomer } from "../../types/UtmifyCustomer";
import { UtmifyPaymentMethod } from "../../types/UtmifyPaymentMethod";
import { UtmifyProduct } from "../../types/UtmifyProduct";
import { UtmifyTransactionStatus } from "../../types/UtmifyTransactionStatus";
import { UtmifyValues } from "../../types/UtmifyValues";
import {
  SaveUtmifyOrderUseCase,
  SaveUtmifyOrderUseCaseInput,
} from "../../usecases/SaveUtmifyOrderUseCase";
import {
  AllOffersBody,
  AllOffersController,
  AllOffersMarketCustomer,
  AllOffersPaymentDetails,
  AllOffersItem,
} from "../AllOffersController";
import { App } from "../../../../server/App";
import { UtmifyIntegrationPlatform } from "../../types/UtmifyIntegrationPlatform";
import { Request, Response } from "express";
import { StatusMachineAction } from "../../actions/StatusMachineAction";
import { ConvertOrderCurrencyAction } from "../../actions/ConvertOrderCurrencyAction";
import { AwesomeApi } from "../../externalApis/AwesomeApi";

const repository = new UtmifyOrdersRepositoryMongoose();
const statusMachineAction = new StatusMachineAction();
const awesomeApi = new AwesomeApi();
const usecase = new SaveUtmifyOrderUseCase(repository, statusMachineAction);
const convertOrderCurrencyAction = new ConvertOrderCurrencyAction(awesomeApi);

const controller = new AllOffersController(usecase, convertOrderCurrencyAction);

afterEach(() => App.close());

describe("handle", () => {
  it("should call usecase with correct params", async () => {
    const body: AllOffersBody = {
      WebhookId: "webhook_66778",
      OrderId: "9988221144",
      PaymentMethod: "CreditCard",
      UserCommission: 30.0,
      TotalSaleAmount: 300.0,
      PlatformCommission: 40.0,
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
          Country: "DE",
        },
        ShippingAddress: {
          Street: "Schönhauser Allee 45",
          City: "Berlin",
          State: "BE",
          ZipCode: "10435",
          Country: "DE",
        },
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
          UnitPrice: 100.0,
          ItemCategory: "Electronics",
          ItemBrand: "KeyWorks",
          ItemSku: "WK-00123",
        },
        {
          ItemId: "prod_890",
          ItemName: "Ergonomic Mouse",
          Quantity: 2,
          UnitPrice: 100.0,
          ItemCategory: "Electronics",
          ItemBrand: "MousePro",
          ItemSku: "EM-04567",
        },
      ],
      ShippingDetails: {
        ShippingMethod: "Express",
        EstimatedDeliveryDate: "2025-01-26T10:00:00Z",
        TrackingNumber: "TRK12345678",
        ShippingStatus: "Shipped",
      },
      PaymentDetails: {
        PaymentStatus: "Paid",
        PaymentMethodDetails: {
          CardType: "Visa",
          Last4Digits: "1234",
          TransactionId: "CC9876543210",
        },
      },
    };

    const mockedMethod = UtmifyPaymentMethod.Pix;
    jest
      .spyOn(controller, "allOffersPaymentMethodToUtmifyPaymentMethod")
      .mockReturnValueOnce(mockedMethod);

    const mockedStatus = UtmifyTransactionStatus.Paid;
    jest
      .spyOn(controller, "allOffersStatusToUtmifyTransactionStatus")
      .mockReturnValueOnce(mockedStatus);

    const mockedProducts: UtmifyProduct[] = [];
    jest
      .spyOn(controller, "allOffersProductsToUtmifyProducts")
      .mockReturnValueOnce(mockedProducts);

    const mockedCustomer: UtmifyCustomer = {
      country: "country",
      email: "email",
      fullName: "fullName",
      id: "id",
      phone: "phone",
    };
    jest
      .spyOn(controller, "allOffersCustomerToUtmifyCustomer")
      .mockReturnValueOnce(mockedCustomer);

    const mockedValues: UtmifyValues = {
      platformValueInCents: 0,
      sellerValueInCents: 0,
      shippingValueInCents: 0,
      totalValueInCents: 0,
    };
    jest
      .spyOn(controller, "allOffersBodyToUtmifyValues")
      .mockResolvedValueOnce(mockedValues);

    jest.spyOn(usecase, "execute").mockResolvedValueOnce();

    const mockedExpressRes = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const res = await controller.handle(
      { body } as Request,
      mockedExpressRes as unknown as Response
    );

    expect(res).toBe(mockedExpressRes.status(200).send());

    expect(
      controller.allOffersPaymentMethodToUtmifyPaymentMethod
    ).toHaveBeenCalledTimes(1);
    expect(
      controller.allOffersStatusToUtmifyTransactionStatus
    ).toHaveBeenCalledTimes(1);
    expect(controller.allOffersProductsToUtmifyProducts).toHaveBeenCalledTimes(
      1
    );
    expect(controller.allOffersCustomerToUtmifyCustomer).toHaveBeenCalledTimes(
      1
    );
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
        paidAt: new Date(body.PaymentDate),
        refundedAt: null,
      },
      additionalInfo: {
        currency: body.Currency,
      },
    } as SaveUtmifyOrderUseCaseInput);

    expect(
      controller.allOffersPaymentMethodToUtmifyPaymentMethod
    ).toHaveBeenCalledWith(body.PaymentMethod);
    expect(
      controller.allOffersStatusToUtmifyTransactionStatus
    ).toHaveBeenCalledWith(body.PaymentDetails.PaymentStatus);
    expect(controller.allOffersProductsToUtmifyProducts).toHaveBeenCalledWith(
      body.Items
    );
    expect(controller.allOffersCustomerToUtmifyCustomer).toHaveBeenCalledWith(
      body.Customer
    );
    expect(controller.allOffersBodyToUtmifyValues).toHaveBeenCalledWith(body);
  });
});

describe("allOffersPaymentMethodToUtmifyPaymentMethod", () => {
  it("should return correct utmify payment method", () => {
    expect(controller.allOffersPaymentMethodToUtmifyPaymentMethod("Pix")).toBe(
      UtmifyPaymentMethod.Pix
    );

    expect(
      controller.allOffersPaymentMethodToUtmifyPaymentMethod("Boleto")
    ).toBe(UtmifyPaymentMethod.Billet);

    expect(
      controller.allOffersPaymentMethodToUtmifyPaymentMethod("CreditCard")
    ).toBe(UtmifyPaymentMethod.CreditCard);
  });

  it("should throw request error if method is invalid", () => {
    const method = "any other" as any;

    try {
      controller.allOffersPaymentMethodToUtmifyPaymentMethod(method);
    } catch (e) {
      expect(e).toEqual(
        new RequestError(400, `Unknown payment method: ${method}`)
      );
    }
  });
});

describe("allOffersStatusToUtmifyTransactionStatus", () => {
  it("should return correct utmify transaction status", () => {
    expect(controller.allOffersStatusToUtmifyTransactionStatus("Pending")).toBe(
      UtmifyTransactionStatus.Pending
    );

    expect(controller.allOffersStatusToUtmifyTransactionStatus("Paid")).toBe(
      UtmifyTransactionStatus.Paid
    );

    expect(
      controller.allOffersStatusToUtmifyTransactionStatus("Refunded")
    ).toBe(UtmifyTransactionStatus.Refunded);
  });

  it("should throw request error if method is invalid", () => {
    const status = "any other" as any;

    try {
      controller.allOffersStatusToUtmifyTransactionStatus(status);
    } catch (e) {
      expect(e).toEqual(
        new RequestError(400, `Unknown payment status: ${status}`)
      );
    }
  });
});

describe("allOffersProductsToUtmifyProducts", () => {
  it("should return correct utmify products", () => {
    const allOffersItem: AllOffersItem[] = [
      {
        ItemName: "T-Shirt",
        ItemCategory: "clothes",
        UnitPrice: 97.0,
        ItemId: "12k3hkahsd",
        Quantity: 1,
        ItemBrand: "Tuna",
        ItemSku: "BS-6789",
      },
      {
        ItemName: "Pants",
        ItemCategory: "clothes",
        UnitPrice: 147.0,
        ItemId: "543hkahere",
        Quantity: 2,
        ItemBrand: "Tuna",
        ItemSku: "KE-5289",
      },
    ];

    expect(controller.allOffersProductsToUtmifyProducts(allOffersItem)).toEqual(
      [
        {
          id: "12k3hkahsd",
          name: "T-Shirt",
          priceInCents: 100 * 97.0,
          quantity: 1,
        },
        {
          id: "543hkahere",
          name: "Pants",
          priceInCents: 100 * 147,
          quantity: 2,
        },
      ] as UtmifyProduct[]
    );
  });
});

describe("allOffersCustomerToUtmifyCustomer", () => {
  it("should return correct utmify customer", () => {
    const allOffersCustomer: AllOffersMarketCustomer = {
      FirstName: "John",
      LastName: "Doe",
      Phone: "+15551234567",
      Email: "john.doe@example.com",
      Country: "US",
      BillingAddress: {
        Street: "123 Elm Street",
        City: "New York",
        State: "NY",
        ZipCode: "10001",
        Country: "US",
      },
      ShippingAddress: {
        Street: "456 Oak Avenue",
        City: "Brooklyn",
        State: "NY",
        ZipCode: "11201",
        Country: "US",
      },
    };

    expect(
      controller.allOffersCustomerToUtmifyCustomer(allOffersCustomer)
    ).toEqual({
      id: allOffersCustomer.Email,
      fullName: allOffersCustomer.FirstName + " " + allOffersCustomer.LastName,
      email: allOffersCustomer.Email,
      phone: allOffersCustomer.Phone,
      country: allOffersCustomer.Country,
    } as UtmifyCustomer);
  });
});

describe("allOffersBodyToUtmifyValues", () => {
  it("should return correct utmify values", async () => {
    const orderDetails: AllOffersBody = {
      WebhookId: "webhook_55667",
      OrderId: "4455667788",
      PaymentMethod: "Pix",
      UserCommission: 853.66,
      TotalSaleAmount: 924.9,
      PlatformCommission: 46.24,
      Currency: "USD",
      SaleStatus: "Refunded",
      Customer: {
        FirstName: "John",
        LastName: "Doe",
        Phone: "+15551234567",
        Email: "john.doe@example.com",
        Country: "US",
        BillingAddress: {
          Street: "123 Elm Street",
          City: "New York",
          State: "NY",
          ZipCode: "10001",
          Country: "US",
        },
        ShippingAddress: {
          Street: "456 Oak Avenue",
          City: "Brooklyn",
          State: "NY",
          ZipCode: "11201",
          Country: "US",
        },
      },
      OrderCreatedDate: "2025-01-20T14:00:00Z",
      PaymentDate: "2025-01-21T10:00:00Z",
      RefundDate: "2025-01-22T16:00:00Z",
      PaymentGateway: "Pix",
      OrderNotes: "Reembolso processado com sucesso.",
      CouponCode: "WINTER25",
      Items: [
        {
          ItemId: "prod_567",
          ItemName: "Bluetooth Speaker",
          Quantity: 1,
          UnitPrice: 200.0,
          ItemCategory: "Electronics",
          ItemBrand: "SoundBlast",
          ItemSku: "BS-6789",
        },
        {
          ItemId: "prod_678",
          ItemName: "Portable Charger",
          Quantity: 1,
          UnitPrice: 200.0,
          ItemCategory: "Accessories",
          ItemBrand: "ChargeNow",
          ItemSku: "PC-1234",
        },
      ],
      ShippingDetails: {
        ShippingMethod: "Standard",
        EstimatedDeliveryDate: "2025-01-25T18:00:00Z",
        TrackingNumber: null,
        ShippingStatus: "Pending",
      },
      PaymentDetails: {
        PaymentStatus: "Refunded",
        PaymentMethodDetails: {
          PixTransactionId: "PIX9876543210",
        },
      },
    };
    const result = await controller.allOffersBodyToUtmifyValues(orderDetails);
    expect(result).toEqual({
      totalValueInCents: Math.round((orderDetails.TotalSaleAmount ?? 0) * 100),
      sellerValueInCents: Math.round((orderDetails.UserCommission ?? 0) * 100),
      shippingValueInCents: 0,
      platformValueInCents: Math.round(
        (orderDetails.PlatformCommission ?? 0) * 100
      ),
    } as UtmifyValues);
  });
});
