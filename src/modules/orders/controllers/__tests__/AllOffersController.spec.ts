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

import { AllOffersBody, AllOffersController } from "../AllOffersController";

import { App } from "../../../../server/App";
import { UtmifyIntegrationPlatform } from "../../types/UtmifyIntegrationPlatform";
import { Request, Response } from "express";
import { ConvertOrderCurrencyAction } from "../../actions/ConvertOrderCurrencyAction";

const repository = new UtmifyOrdersRepositoryMongoose();
const usecase = new SaveUtmifyOrderUseCase(repository);
const convertOrderCurrencyToBRL = new ConvertOrderCurrencyAction();

const controller = new AllOffersController(
  usecase,
  convertOrderCurrencyToBRL,
  repository
);

afterEach(() => App.close());

describe("handle", () => {
  it("should call usecase with correct params", async () => {
    const body: AllOffersBody = {
      WebhookId: "webhook_55667",
      OrderId: "4455667788",
      PaymentMethod: "Pix",
      UserCommission: 40.0,
      TotalSaleAmount: 400.0,
      PlatformCommission: 50.0,
      Currency: "USD",
      SaleStatus: "Paid",
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

    const mockedMethod = UtmifyPaymentMethod.Pix;
    jest
      .spyOn(controller, "allOffersPaymentMethodToUtmifyPaymentMethod")
      .mockReturnValueOnce(mockedMethod);

    const mockedStatus = UtmifyTransactionStatus.Refunded;
    jest
      .spyOn(controller, "allOffersStatusToUtmifyTransactionStatus")
      .mockResolvedValueOnce(mockedStatus);

    const mockedProducts: UtmifyProduct[] = [];
    jest
      .spyOn(controller, "allOffersProductsToUtmifyProducts")
      .mockResolvedValueOnce(mockedProducts);

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

    expect(mockedExpressRes.status).toHaveBeenCalledWith(200);
    expect(mockedExpressRes.send).toHaveBeenCalled();

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
        paidAt: null,
        refundedAt: new Date(body.RefundDate),
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
    ).toHaveBeenCalledWith(body.SaleStatus, body);
    expect(controller.allOffersProductsToUtmifyProducts).toHaveBeenCalledWith(
      body.Items,
      body.Currency
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
