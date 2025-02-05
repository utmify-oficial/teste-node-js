import { Request, Response } from "express";
import { Controller } from "../../../core/interfaces/Controller";
import { SaveUtmifyOrderUseCase } from "../usecases/SaveUtmifyOrderUseCase";
import { UtmifyIntegrationPlatform } from "../types/UtmifyIntegrationPlatform";
import { UtmifyTransactionStatus } from "../types/UtmifyTransactionStatus";
import { UtmifyPaymentMethod } from "../types/UtmifyPaymentMethod";
import { RequestError } from "../../../core/errors/RequestError";
import { UtmifyProduct } from "../types/UtmifyProduct";
import { UtmifyCustomer } from "../types/UtmifyCustomer";
import { UtmifyValues } from "../types/UtmifyValues";
import { ConvertOrderCurrencyAction } from "../actions/ConvertOrderCurrencyAction";

export class AllOffersController implements Controller {
  private readonly usecase: SaveUtmifyOrderUseCase;
  private readonly convertOrderCurrencyAction: ConvertOrderCurrencyAction;
  constructor(
    usecase: SaveUtmifyOrderUseCase,
    convertOrderCurrencyAction: ConvertOrderCurrencyAction
  ) {
    this.usecase = usecase;
    this.convertOrderCurrencyAction = convertOrderCurrencyAction;
  }

  async handle(req: Request, res: Response): Promise<Response> {
    const body = req.body as AllOffersBody;

    const paymentMethod = this.allOffersPaymentMethodToUtmifyPaymentMethod(
      body.PaymentMethod
    );

    //Status Machine
    const transactionStatus = this.allOffersStatusToUtmifyTransactionStatus(
      body.PaymentDetails.PaymentStatus
    );

    const products = this.allOffersProductsToUtmifyProducts(body.Items);

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
          transactionStatus === UtmifyTransactionStatus.Refunded &&
          body.RefundDate
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
    method: AllOffersPaymentMethod
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

  allOffersStatusToUtmifyTransactionStatus(
    status: AllOffersPaymentStatus
  ): UtmifyTransactionStatus {
    switch (status) {
      case "Pending":
        return UtmifyTransactionStatus.Pending;
      case "Paid":
        return UtmifyTransactionStatus.Paid;
      case "Refunded":
        return UtmifyTransactionStatus.Refunded;
      default:
        throw new RequestError(400, `Unknown payment status: ${status}`);
    }
  }

  allOffersProductsToUtmifyProducts(
    products: AllOffersItem[]
  ): UtmifyProduct[] {
    return products.map(({ ItemId, ItemName, Quantity, UnitPrice }) => ({
      id: ItemId,
      name: ItemName,
      priceInCents: UnitPrice * 100,
      quantity: Quantity,
    }));
  }

  allOffersCustomerToUtmifyCustomer(
    customer: AllOffersMarketCustomer
  ): UtmifyCustomer {
    return {
      id: customer.Email,
      fullName: customer.FirstName + " " + customer.LastName,
      email: customer.Email,
      phone: customer.Phone,
      country: customer.Country ?? null,
    };
  }

  async allOffersBodyToUtmifyValues(
    orderDetails: AllOffersBody
  ): Promise<UtmifyValues> {
    if (orderDetails.Currency !== "BRL") {
      orderDetails.TotalSaleAmount =
        await this.convertOrderCurrencyAction.execute({
          currency: orderDetails.Currency,
          value: orderDetails.TotalSaleAmount,
        });
      orderDetails.UserCommission =
        await this.convertOrderCurrencyAction.execute({
          currency: orderDetails.Currency,
          value: orderDetails.UserCommission,
        });
      orderDetails.PlatformCommission =
        await this.convertOrderCurrencyAction.execute({
          currency: orderDetails.Currency,
          value: orderDetails.PlatformCommission,
        });
    }
    return {
      totalValueInCents: Math.round((orderDetails.TotalSaleAmount ?? 0) * 100),
      sellerValueInCents: Math.round((orderDetails.UserCommission ?? 0) * 100),
      shippingValueInCents: 0,
      platformValueInCents: Math.round(
        (orderDetails.PlatformCommission ?? 0) * 100
      ),
    };
  }
}

export type AllOffersBody = {
  WebhookId: string;
  OrderId: string;
  PaymentMethod: AllOffersPaymentMethod;
  UserCommission: number;
  TotalSaleAmount: number;
  PlatformCommission: number;
  Currency: AllOffersCurrency;
  SaleStatus: AllOffersStatus;
  Customer: AllOffersMarketCustomer;
  OrderCreatedDate: string;
  PaymentDate: string;
  RefundDate: string | null;
  PaymentGateway: AllOffersPaymentMethod;
  OrderNotes: string;
  CouponCode: string;
  Items: AllOffersItem[];
  ShippingDetails: AllOffersShippingDetails;
  PaymentDetails: AllOffersPaymentDetails;
};

export type AllOffersMarketCustomer = {
  FirstName: string;
  LastName: string;
  Phone: string;
  Email: string;
  Country: string;
  BillingAddress: AllOffersMarketCustomerAddress;
  ShippingAddress: AllOffersMarketShippingAddress;
};

export type AllOffersMarketCustomerAddress = {
  Street: string;
  City: string;
  State: string;
  ZipCode: string;
  Country: string;
};
export type AllOffersMarketShippingAddress = {
  Street: string;
  City: string;
  State: string;
  ZipCode: string;
  Country: string;
};

export type WorldMarketOrderDetails = {
  products: WorldMarketProduct[];
  total: number;
  shipping_fee: number;
  platform_fee: number;
  seller_fee: number;
};

export type WorldMarketProduct = {
  product_id: string;
  name: string;
  category: string;
  quantity: number;
  price_unit: number;
  total_price: number;
};

export type AllOffersPaymentDetails = {
  PaymentStatus: AllOffersPaymentStatus;
  PaymentMethodDetails: AllOffersPaymentMethodDetails;
};

export type AllOffersPaymentMethod = "Pix" | "Boleto" | "CreditCard";

export type AllOffersStatus = "AwaitingPayment" | "Paid" | "Refunded";

export type AllOffersPaymentStatus = "Pending" | "Paid" | "Refunded";

export type AllOffersShippingStatus = "Pending" | "Shipped";

export type AllOffersCurrency = "USD" | "EUR" | "BRL";

export type AllOffersShippingDetails = {
  ShippingMethod: string;
  EstimatedDeliveryDate: string;
  TrackingNumber: string | null;
  ShippingStatus: AllOffersShippingStatus;
};

export type AllOffersPaymentMethodDetails = {
  PixTransactionId?: string;
  BoletoNumber?: string;
  CardType?: string;
  Last4Digits?: string;
  TransactionId?: string;
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
