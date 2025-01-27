/* eslint-disable no-console */
import { Request, Response } from 'express';
import { Controller } from '../../../core/interfaces/Controller';
import { SaveUtmifyOrderUseCase } from '../usecases/SaveUtmifyOrderUseCase';
import { UtmifyPaymentMethod } from '../types/UtmifyPaymentMethod';
import { UtmifyTransactionStatus } from '../types/UtmifyTransactionStatus';
import { UtmifyProduct } from '../types/UtmifyProduct';
import { UtmifyCustomer } from '../types/UtmifyCustomer';
import { UtmifyValues } from '../types/UtmifyValues';
import { UtmifyIntegrationPlatform } from '../types/UtmifyIntegrationPlatform';
import { RequestError } from '../../../core/errors/RequestError';
import { ConvertOrderCurrencyAction } from '../actions/ConvertOrderCurrencyAction';

export class AllOffersController implements Controller {
  private readonly usecase: SaveUtmifyOrderUseCase;
  private readonly currencyAction: ConvertOrderCurrencyAction;

  constructor(usecase: SaveUtmifyOrderUseCase, currencyAction: ConvertOrderCurrencyAction) {
    this.usecase = usecase;
    this.currencyAction = currencyAction;
  }

  async handle(req: Request, res: Response): Promise<Response> {
    console.log('AllOffers order received');
    console.log(JSON.stringify(req.body, null, 2));
    console.log(JSON.stringify(req.headers));

    const body = req.body as AllOffersBody;

    this.currencyAction.code = body.Currency;

    const convertedCurrencyUnit = await this.currencyAction.execute(1);

    const paymentMethod = this.allOffersPaymentMethodToUtmifyPaymentMethod(
      body.PaymentMethod,
    );

    const transactionStatus = this.allOffersStatusToUtmifyTransactionStatus(
      body.PaymentDetails.PaymentStatus,
    );

    const products = this.allOffersProductsToUtmifyProducts(body.Items, convertedCurrencyUnit);

    const customer = this.allOffersCustomerToUtmifyCustomer(body.Customer);

    const values = this.allOffersBodyToUtmifyValues(body, convertedCurrencyUnit);

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
        paidAt: transactionStatus === UtmifyTransactionStatus.Paid && body.PaymentDate ? new Date(body.PaymentDate) : null,
        refundedAt: transactionStatus === UtmifyTransactionStatus.Refunded && body.RefundDate ? new Date(body.RefundDate) : null,
      },
      additionalInfo: {
        currency: body.Currency,
      },
    });

    return res.status(200).send();
  }

  allOffersPaymentMethodToUtmifyPaymentMethod(method: AllOffersPaymentMethod): UtmifyPaymentMethod {
    switch (method) {
      case 'Pix': return UtmifyPaymentMethod.Pix;
      case 'Boleto': return UtmifyPaymentMethod.Billet;
      case 'CreditCard': return UtmifyPaymentMethod.CreditCard;
      default: throw new RequestError(400, `Unknown payment method: ${method}`);
    }
  }

  allOffersStatusToUtmifyTransactionStatus(status: AllOffersPaymentStatus): UtmifyTransactionStatus {
    switch (status) {
      case 'Pending': return UtmifyTransactionStatus.Pending;
      case 'Paid': return UtmifyTransactionStatus.Paid;
      case 'Refunded': return UtmifyTransactionStatus.Refunded;
      default: throw new RequestError(400, `Unknown payment status: ${status}`);
    }
  }

  allOffersProductsToUtmifyProducts(products: AllOffersItem[], convertedCurrencyUnit: number): UtmifyProduct[] {
    return products.map(({ ItemId, ItemName, Quantity, UnitPrice }) => ({
      id: ItemId,
      name: ItemName,
      priceInCents: convertedCurrencyUnit * UnitPrice * 100,
      quantity: Quantity,
    }));
  }

  allOffersCustomerToUtmifyCustomer(customer: AllOffersCustomer): UtmifyCustomer {
    return {
      id: customer.Email,
      fullName: customer.FirstName + ' ' + customer.LastName,
      email: customer.Email,
      phone: customer.Phone,
      country: customer.Country,
    };
  }

  allOffersBodyToUtmifyValues(orderDetails: AllOffersBody, convertedCurrencyUnit: number): UtmifyValues {
    return {
      totalValueInCents: convertedCurrencyUnit * (orderDetails.TotalSaleAmount ?? 0) * 100,
      sellerValueInCents: convertedCurrencyUnit * (orderDetails.UserCommission ?? 0) * 100,
      shippingValueInCents: 0,
      platformValueInCents: convertedCurrencyUnit * (orderDetails.PlatformCommission ?? 0) * 100,
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
  Currency: string;
  SaleStatus: AllOffersSaleStatus;
  Customer: AllOffersCustomer;
  OrderCreatedDate: string;
  PaymentDate: string | null;
  RefundDate: string | null;
  PaymentGateway: AllOffersPaymentGateway;
  OrderNotes: string;
  CouponCode: string;
  Items: AllOffersItem[];
  ShippingDetails: AllOffersShippingDetails;
  PaymentDetails: AllOffersPaymentDetails;
};

export type AllOffersPaymentMethod = 'Pix' | 'Boleto' | 'CreditCard';

export type AllOffersSaleStatus = 'AwaitingPayment' | 'Paid' | 'Refunded';

export type AllOffersCustomer = {
  FirstName: string;
  LastName: string;
  Phone: string;
  Email: string;
  Country: string;
  BillingAddress: AllOffersCustomerAddress;
  ShippingAddress: AllOffersCustomerAddress;
};

export type AllOffersCustomerAddress = {
  Street: string;
  City: string;
  State: string;
  ZipCode: string;
  Country: string;
};

export type AllOffersPaymentGateway = 'Pix' | 'Boleto' | 'CreditCard';

export type AllOffersItem = {
  ItemId: string;
  ItemName: string;
  Quantity: number;
  UnitPrice: number;
  ItemCategory: string;
  ItemBrand: string;
  ItemSku: string;
};

export type AllOffersShippingDetails = {
  ShippingMethod: string;
  EstimatedDeliveryDate: string;
  TrackingNumber: string | null;
  ShippingStatus: string;
};

export type AllOffersPaymentDetails = {
  PaymentStatus: AllOffersPaymentStatus;
  PaymentMethodDetails: AllOffersPaymentMethodDetails;
};

export type AllOffersPaymentStatus = 'Pending' | 'Paid' | 'Refunded';

export type AllOffersPaymentMethodDetails = {
  PixTransactionId?: string;
  CardType?: string;
  Last4Digits?: string;
  TransactionId?: string;
  BoletoNumber?: string;
};
