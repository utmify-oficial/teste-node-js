/* eslint-disable no-console */
import { Request, Response } from "express";
import { Controller } from "../../../core/interfaces/Controller";
import { SaveUtmifyOrderUseCase } from "../usecases/SaveUtmifyOrderUseCase";
import { UtmifyPaymentMethod } from "../types/UtmifyPaymentMethod";
import { UtmifyTransactionStatus } from "../types/UtmifyTransactionStatus";
import { UtmifyProduct } from "../types/UtmifyProduct";
import { UtmifyCustomer } from "../types/UtmifyCustomer";
import { UtmifyValues } from "../types/UtmifyValues";
import { UtmifyIntegrationPlatform } from "../types/UtmifyIntegrationPlatform";
import { RequestError } from "../../../core/errors/RequestError";
import { ConvertOrderCurrencyAction } from "../actions/ConvertOrderCurrencyAction";

function isValidDate(date: string): boolean {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

export class AllOffersController implements Controller {
  private readonly usecase: SaveUtmifyOrderUseCase;
  private readonly convertCurrencyAction: ConvertOrderCurrencyAction;

  constructor(
    usecase: SaveUtmifyOrderUseCase,
    convertCurrencyAction: ConvertOrderCurrencyAction
  ) {
    this.usecase = usecase;
    this.convertCurrencyAction = convertCurrencyAction;
  }

  async handle(req: Request, res: Response): Promise<Response> {
    console.log("AllOffers order received");
    console.log(JSON.stringify(req.body, null, 2));
    console.log(JSON.stringify(req.headers));

    const body = req.body as allOffersBody;

    const paymentMethod = this.allOffersPaymentMethodToUtmifyPaymentMethod(
      body.PaymentMethod
    );

    const transactionStatus = this.allOffersStatusToUtmifyTransactionStatus(
      body.SaleStatus
    );

    const products = this.AllOffersProductsToUtmifyProducts(body.Items);

    const customer = this.AllOffersCustomerToUtmifyCustomer(body.Customer);

    let values = this.allOffersBodyToUtmifyValues(
      body.TotalSaleAmount,
      body.UserCommission,
      body.shipping_fee,
      body.PlatformCommission
    );
    if (body.Currency !== "BRL") {
      const convertedValues = await this.convertCurrencyAction.execute({
        currency: body.Currency,
        totalSaleAmount: body.TotalSaleAmount,
        userCommission: body.UserCommission,
        platformCommission: body.PlatformCommission,
      });

      values = {
        totalValueInCents: Math.round(
          convertedValues.totalSaleAmountInBRL * 100
        ),
        sellerValueInCents: Math.round(
          convertedValues.userCommissionInBRL * 100
        ),
        platformValueInCents: Math.round(
          convertedValues.platformCommissionInBRL * 100
        ),
        shippingValueInCents: 0,
      };
    }
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
            ? isValidDate(body.paid_at)
              ? new Date(body.paid_at)
              : null
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
    method: WorldMarketPaymentMethod
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
    status: AllOffersStatus
  ): UtmifyTransactionStatus {
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

  AllOffersProductsToUtmifyProducts(
    Items: AllOffersProduct[]
  ): UtmifyProduct[] {
    return Items.map(({ ItemId, ItemName, Quantity, UnitPrice }) => ({
      id: ItemId,
      name: ItemName,
      priceInCents: UnitPrice * 100,
      quantity: Quantity,
    }));
  }

  AllOffersCustomerToUtmifyCustomer(
    Customer: AllOffersCustomer
  ): UtmifyCustomer {
    return {
      id: `cust_${Math.floor(Math.random() * 10000)}`,
      fullName: `${Customer.FirstName} ${Customer.LastName}`,
      email: Customer.Email,
      phone: Customer.Phone,
      country: Customer.Country ?? null,
    };
  }

  allOffersBodyToUtmifyValues(
    totalValueInCents: number,
    sellerValueInCents: number,
    shippingValueInCents: number,
    platformValueInCents: number
  ): UtmifyValues {
    return {
      totalValueInCents: (totalValueInCents ?? 0) * 100,
      sellerValueInCents: (sellerValueInCents ?? 0) * 100,
      shippingValueInCents: (shippingValueInCents ?? 0) * 100,
      platformValueInCents: (platformValueInCents ?? 0) * 100,
    };
  }
}

export type allOffersBody = {
  OrderId: string;
  WebhookId: string;
  Customer: AllOffersCustomer;
  Items: AllOffersProduct[];
  TotalSaleAmount: number;
  shipping_fee: number;
  PlatformCommission: number;
  UserCommission: number;

  PaymentMethod: WorldMarketPaymentMethod;
  Currency: string;
  SaleStatus: AllOffersStatus;
  created_at: string;
  updated_at: string;
  notes: string;
  paid_at: string;

  OrderCreatedDate: string;
  PaymentDate: string;
  RefundDate: string;
  PaymentGateway: string;
  OrderNotes: string;
  CouponCode: string;
};

export type AllOffersCustomer = {
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  Country: string;
};

export type AllOffersProduct = {
  ItemId: string;
  ItemName: string;
  Quantity: number;
  UnitPrice: number;
  ItemCategory: string;
  ItemBrand: string;
  ItemSku: string;
};

export type WorldMarketPaymentMethod = "Pix" | "Boleto" | "CreditCard";

export type AllOffersStatus = "AwaitingPayment" | "Paid" | "Refunded";
