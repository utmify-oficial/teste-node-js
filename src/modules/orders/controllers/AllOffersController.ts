import { Controller } from "../../../core/interfaces/Controller";
import { UtmifyIntegrationPlatform } from "../types/UtmifyIntegrationPlatform";
import { SaveUtmifyOrderUseCase } from "../usecases/SaveUtmifyOrderUseCase";
import { Request, Response } from "express";
import { UtmifyPaymentMethod } from "../types/UtmifyPaymentMethod";
import { RequestError } from "../../../core/errors/RequestError";
import { UtmifyTransactionStatus } from "../types/UtmifyTransactionStatus";
import { UtmifyProduct } from "../types/UtmifyProduct";
import { UtmifyCustomer } from "../types/UtmifyCustomer";
import { UtmifyValues } from "../types/UtmifyValues";
import { ConvertOrderCurrencyAction } from "../actions/ConvertOrderCurrencyAction";
import { UtmifyOrdersRepository } from "../repositories/UtmifyOrdersRepository";

export class AllOffersController implements Controller {
  private readonly usecase: SaveUtmifyOrderUseCase;
  private readonly convertOrderCurrencyToBRL: ConvertOrderCurrencyAction;
  private readonly orderRepository: UtmifyOrdersRepository;

  constructor(
    usecase: SaveUtmifyOrderUseCase,
    convertOrderCurrencyToBRL: ConvertOrderCurrencyAction,
    orderRepository: UtmifyOrdersRepository
  ) {
    this.usecase = usecase;
    this.convertOrderCurrencyToBRL = convertOrderCurrencyToBRL;
    this.orderRepository = orderRepository;
  }

  async handle(req: Request, res: Response): Promise<Response> {
    console.log("AllOffers order received");
    console.log(JSON.stringify(req.body, null, 2));
    console.log(JSON.stringify(req.headers));

    const body = req.body as AllOffersBody;

    const paymentMethod = this.allOffersPaymentMethodToUtmifyPaymentMethod(
      body.PaymentMethod
    );

    const transactionStatus =
      await this.allOffersStatusToUtmifyTransactionStatus(
        body.SaleStatus,
        body
      );

    const products = await this.allOffersProductsToUtmifyProducts(
      body.Items,
      body.Currency
    );

    const customer = this.allOffersCustomerToUtmifyCustomer(body.Customer);

    const values = await this.allOffersBodyToUtmifyValues(body);

    await this.usecase.execute({
      data: {
        saleId: body.OrderId,
        externalWebhookId: body.WebhookId,
        platform: UtmifyIntegrationPlatform.AllOffers,
        paymentMethod,
        transactionStatus,
        products,
        customer,
        values,
        createdAt: new Date(body.OrderCreatedDate),
        updatedAt: new Date(),
        paidAt:
          transactionStatus === UtmifyTransactionStatus.Paid
            ? new Date(body.PaymentDate)
            : null,
        refundedAt:
          transactionStatus === UtmifyTransactionStatus.Refunded
            ? new Date(body.RefundDate)
            : null,
      },
      additionalInfo: {
        currency: body.Currency,
      },
    });

    return res.status(200).send();
  }

  allOffersPaymentMethodToUtmifyPaymentMethod(
    method: AllOffersPaymentMethodsOrPaymentGateways
  ): UtmifyPaymentMethod {
    switch (method) {
      case "Pix":
        return UtmifyPaymentMethod.Pix;
      case "Boleto":
        return UtmifyPaymentMethod.Billet;
      case "CreditCard":
        return UtmifyPaymentMethod.CreditCard;
      default:
        throw new RequestError(400, `Unknown payment method: ${method}`);
    }
  }

  async allOffersStatusToUtmifyTransactionStatus(
    status: AllOffersSaleStatus,
    orderBody: AllOffersBody
  ): Promise<UtmifyTransactionStatus> {
    const existingOrder = await this.orderRepository.findBySaleId(
      orderBody.OrderId
    );

    if (existingOrder) {
      const { transactionStatus } = existingOrder;
      switch (status) {
        case "AwaitingPayment":
          if (transactionStatus === UtmifyTransactionStatus.Paid) {
            throw new RequestError(
              400,
              "Paid orders cannot be changed to Pending."
            );
          }
          if (transactionStatus === UtmifyTransactionStatus.Refunded) {
            throw new RequestError(
              400,
              "Refunded orders cannot be changed to Pending."
            );
          }
          return UtmifyTransactionStatus.Pending;

        case "Paid":
          if (transactionStatus === UtmifyTransactionStatus.Refunded) {
            throw new RequestError(
              400,
              "Refunded orders cannot be changed to Paid."
            );
          }
          return UtmifyTransactionStatus.Paid;

        case "Refunded":
          if (transactionStatus === UtmifyTransactionStatus.Paid) {
            return UtmifyTransactionStatus.Refunded;
          }
          if (transactionStatus === UtmifyTransactionStatus.Pending) {
            throw new RequestError(
              400,
              "Pending orders cannot be changed to Refunded."
            );
          }

        default:
          throw new RequestError(400, `Unknown payment status: ${status}`);
      }
    } else {
      switch (status) {
        case "AwaitingPayment":
          return UtmifyTransactionStatus.Pending;

        case "Paid":
          return UtmifyTransactionStatus.Paid;

        case "Refunded":
          return UtmifyTransactionStatus.Refunded;

        default:
          throw new RequestError(400, `Unknown payment status: ${status}`);
      }
    }
  }

  async allOffersProductsToUtmifyProducts(
    products: AllOffersItem[],
    currency: AllOffersCurrency
  ): Promise<UtmifyProduct[]> {
    const convertedPrices = await Promise.all(
      products.map(({ UnitPrice }) =>
        this.convertOrderCurrencyToBRL.execute({
          amount: UnitPrice,
          currency: currency,
        })
      )
    );

    return products.map(({ ItemId, ItemName, Quantity }, index) => ({
      id: ItemId,
      name: ItemName,
      priceInCents: Math.round(convertedPrices[index] * 100),
      quantity: Quantity,
    }));
  }

  allOffersCustomerToUtmifyCustomer(
    customer: AllOffersCustomer
  ): UtmifyCustomer {
    return {
      id: crypto.randomUUID(),
      fullName: `${customer.FirstName} ${customer.LastName}`,
      email: customer.Email,
      phone: customer.Phone,
      country: customer.Country ?? null,
    };
  }

  async allOffersBodyToUtmifyValues(
    orderDetails: AllOffersBody
  ): Promise<UtmifyValues> {
    const totalValueInBRL = await this.convertOrderCurrencyToBRL.execute({
      amount: orderDetails.TotalSaleAmount ?? 0,
      currency: orderDetails.Currency,
    });

    const sellerValueInBRL = await this.convertOrderCurrencyToBRL.execute({
      amount: orderDetails.UserCommission ?? 0,
      currency: orderDetails.Currency,
    });

    const platformValueInBRL = await this.convertOrderCurrencyToBRL.execute({
      amount: orderDetails.PlatformCommission ?? 0,
      currency: orderDetails.Currency,
    });

    return {
      totalValueInCents: Math.round(totalValueInBRL * 100),
      sellerValueInCents: Math.round(sellerValueInBRL * 100),
      shippingValueInCents: 0,
      platformValueInCents: Math.round(platformValueInBRL * 100),
    };
  }
}

export type AllOffersBody = {
  WebhookId: string;
  OrderId: string;
  PaymentMethod: AllOffersPaymentMethodsOrPaymentGateways;
  UserCommission: number;
  TotalSaleAmount: number;
  PlatformCommission: number;
  Currency: AllOffersCurrency;
  SaleStatus: AllOffersSaleStatus;
  Customer: AllOffersCustomer;
  OrderCreatedDate: string;
  PaymentDate: string;
  RefundDate: string;
  PaymentGateway: AllOffersPaymentMethodsOrPaymentGateways;
  OrderNotes: string;
  CouponCode: string;
  Items: AllOffersItem[];
  ShippingDetails: AllOffersShippingDetails;
  PaymentDetails: AllOffersPaymentDetails;
};

export type AllOffersPaymentMethodsOrPaymentGateways =
  | "Pix"
  | "CreditCard"
  | "Boleto";

export type AllOffersCurrency = "BRL" | "USD" | "EUR";

export type AllOffersSaleStatus = "AwaitingPayment" | "Refunded" | "Paid";

export type AllOffersCustomer = {
  FirstName: string;
  LastName: string;
  Phone: string;
  Email: string;
  Country: string;
  BillingAddress: {
    Street: string;
    City: string;
    State: string;
    ZipCode: string;
    Country: string;
  };
  ShippingAddress: {
    Street: string;
    City: string;
    State: string;
    ZipCode: string;
    Country: string;
  };
};

export type AllOffersItem = {
  ItemId: string;
  ItemName: string;
  Quantity: number;
  UnitPrice: number;
  ItemCategory: string;
  ItemBrand: string;
  ItemSku: string;
};

export type AllOffersShippingDetailsStatus = "Pending" | "Shipped";

export type AllOffersShippingDetailsMethod = "Express" | "Standard";

export type AllOffersShippingDetails = {
  ShippingMethod: AllOffersShippingDetailsMethod;
  EstimatedDeliveryDate: string;
  TrackingNumber: string | null;
  ShippingStatus: AllOffersShippingDetailsStatus;
};

export type AllOffersPaymentDetailsStatus = "Refunded" | "Paid" | "Pending";

export type AllOffersPaymentDetails = {
  PaymentStatus: AllOffersPaymentDetailsStatus;
  PaymentMethodDetails: {
    PixTransactionId?: string;
    BoletoNumber?: string;
    CardType?: string;
    Last4Digits?: string;
    TransactionId?: string;
  };
};
