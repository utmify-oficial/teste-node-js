import { RequestError } from "../../../../core/errors/RequestError";
import { UtmifyOrdersRepositoryMongoose } from "../../repositories/implementations/UtmifyOrdersRepositoryMongoose";
import { UtmifyCustomer } from "../../types/UtmifyCustomer";
import { UtmifyPaymentMethod } from "../../types/UtmifyPaymentMethod";
import { UtmifyProduct } from "../../types/UtmifyProduct";
import { UtmifyTransactionStatus } from "../../types/UtmifyTransactionStatus";
import { UtmifyValues } from "../../types/UtmifyValues";
import { ConvertOrderCurrencyAction } from "../../actions/ConvertOrderCurrencyAction";
import {
  SaveUtmifyOrderUseCase,
  SaveUtmifyOrderUseCaseInput,
} from "../../usecases/SaveUtmifyOrderUseCase";
import {
  allOffersBody,
  AllOffersController,
  AllOffersCustomer,
  AllOffersProduct,
} from "../AllOffersController";
import { App } from "../../../../server/App";
import { UtmifyIntegrationPlatform } from "../../types/UtmifyIntegrationPlatform";
import { Request, Response } from "express";
const convertCurrency = new ConvertOrderCurrencyAction();
const repository = new UtmifyOrdersRepositoryMongoose();
const usecase = new SaveUtmifyOrderUseCase(repository);
const controller = new AllOffersController(usecase, convertCurrency);

afterEach(() => App.close());

describe("handle", () => {
  it("should call usecase with correct params", async () => {
    const body: allOffersBody = {
      OrderId: "876543210",
      WebhookId: "wh_112233445",
      Customer: {
        FirstName: "Lucas",
        LastName: "Mendes",
        Email: "lucas.mendes@email.com",
        Phone: "+55 62 91234-5678",
        Country: "BR",
      },
      Items: [
        {
          ItemId: "prod_401",
          ItemName: "Smartphone Android",
          ItemCategory: "Eletrônicos",
          Quantity: 1,
          UnitPrice: 1299.9,
          ItemBrand: "BrandA",
          ItemSku: "SKU123",
        },
        {
          ItemId: "prod_402",
          ItemName: "Película de Vidro",
          ItemCategory: "Acessórios",
          Quantity: 1,
          UnitPrice: 39.9,
          ItemBrand: "BrandB",
          ItemSku: "SKU124",
        },
      ],
      TotalSaleAmount: 1369.8,
      shipping_fee: 20.0,
      PlatformCommission: 68.49,
      UserCommission: 1281.31,
      PaymentMethod: "Pix",
      Currency: "BRL",
      SaleStatus: "Paid",
      created_at: "2025-01-24T14:00:00Z",
      updated_at: "2025-01-24T14:15:30Z",
      notes:
        "Pagamento confirmado via PIX. O pedido está em processamento para envio.",
      paid_at: "2025-01-24T14:15:00Z",
      OrderCreatedDate: "2025-01-24T14:00:00Z",
      PaymentDate: "2025-01-24T14:15:00Z",
      RefundDate: "2025-01-25T14:15:00Z",
      PaymentGateway: "GatewayA",
      OrderNotes: "Nota do pedido",
      CouponCode: "CUPOM123",
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
      .spyOn(controller, "AllOffersProductsToUtmifyProducts")
      .mockReturnValueOnce(mockedProducts);

    const mockedCustomer: UtmifyCustomer = {
      country: "country",
      email: "email",
      fullName: "fullName",
      id: "id",
      phone: "phone",
    };
    jest
      .spyOn(controller, "AllOffersCustomerToUtmifyCustomer")
      .mockReturnValueOnce(mockedCustomer);

    const mockedValues: UtmifyValues = {
      platformValueInCents: 0,
      sellerValueInCents: 0,
      shippingValueInCents: 0,
      totalValueInCents: 0,
    };
    jest
      .spyOn(controller, "allOffersBodyToUtmifyValues")
      .mockReturnValueOnce(mockedValues);

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
    expect(controller.AllOffersProductsToUtmifyProducts).toHaveBeenCalledTimes(
      1
    );
    expect(controller.AllOffersCustomerToUtmifyCustomer).toHaveBeenCalledTimes(
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
        paidAt: new Date(body.paid_at),
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
    ).toHaveBeenCalledWith(body.SaleStatus);
    expect(controller.AllOffersProductsToUtmifyProducts).toHaveBeenCalledWith(
      body.Items
    );
    expect(controller.AllOffersCustomerToUtmifyCustomer).toHaveBeenCalledWith(
      body.Customer
    );
    expect(controller.allOffersBodyToUtmifyValues).toHaveBeenCalledWith(
      body.TotalSaleAmount,
      body.UserCommission,
      body.shipping_fee,
      body.PlatformCommission
    );
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
    expect(
      controller.allOffersStatusToUtmifyTransactionStatus("AwaitingPayment")
    ).toBe(UtmifyTransactionStatus.Pending);

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

describe("AllOffersProductsToUtmifyProducts", () => {
  it("should return correct utmify products", () => {
    const allOffersProducts: AllOffersProduct[] = [
      {
        ItemId: "12k3hkahsd",
        ItemName: "T-Shirt",
        ItemCategory: "clothes",
        UnitPrice: 97.0,
        Quantity: 1,
        ItemBrand: "BrandA",
        ItemSku: "SKU123",
      },
      {
        ItemId: "12k3hkahsh",
        ItemName: "Pants",
        ItemCategory: "clothes",
        UnitPrice: 119.9,
        Quantity: 2,
        ItemBrand: "BrandB",
        ItemSku: "SKU124",
      },
    ];

    expect(
      controller.AllOffersProductsToUtmifyProducts(allOffersProducts)
    ).toEqual([
      {
        id: "12k3hkahsd",
        name: "T-Shirt",
        priceInCents: 100 * 97.0,
        quantity: 1,
      },
      {
        id: "12k3hkahsh",
        name: "Pants",
        priceInCents: 100 * 119.9,
        quantity: 2,
      },
    ] as UtmifyProduct[]);
  });
});

describe("AllOffersCustomerToUtmifyCustomer", () => {
  it("should return correct utmify customer", () => {
    const allOffersCustomer: AllOffersCustomer = {
      FirstName: "Fernanda",
      LastName: "Costa",
      Email: "fernanda.costa@email.com",
      Phone: "+55 11 95678-4321",
      Country: "BR",
    };

    expect(
      controller.AllOffersCustomerToUtmifyCustomer(allOffersCustomer)
    ).toEqual({
      id: expect.any(String),
      fullName: `${allOffersCustomer.FirstName} ${allOffersCustomer.LastName}`,
      email: allOffersCustomer.Email,
      phone: allOffersCustomer.Phone,
      country: allOffersCustomer.Country,
    } as UtmifyCustomer);
  });
});

describe("allOffersBodyToUtmifyValues", () => {
  it("should return correct utmify values", () => {
    const totalSaleAmount = 924.9;
    const shipping_fee = 25.0;
    const platformCommission = 46.24;
    const userCommission = 853.66;

    expect(
      controller.allOffersBodyToUtmifyValues(
        totalSaleAmount,
        userCommission,
        shipping_fee,
        platformCommission
      )
    ).toEqual({
      totalValueInCents: 100 * totalSaleAmount,
      sellerValueInCents: 100 * userCommission,
      platformValueInCents: 100 * platformCommission,
      shippingValueInCents: 100 * shipping_fee,
    } as UtmifyValues);
  });
});
