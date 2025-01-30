/* eslint-disable max-len */
import { Request, Response } from 'express';
import { Controller } from '../../../core/interfaces/Controller';
import { UtmifyPaymentMethod } from '../types/UtmifyPaymentMethod';
import { RequestError } from '../../../core/errors/RequestError';
import { UtmifyTransactionStatus } from '../types/UtmifyTransactionStatus';
import { UtmifyCustomer } from '../types/UtmifyCustomer';
import { UtmifyProduct } from '../types/UtmifyProduct';
import { UtmifyIntegrationPlatform } from '../types/UtmifyIntegrationPlatform';
import { UtmifyValues } from '../types/UtmifyValues';
import { SaveUtmifyOrderUseCase } from '../usecases/SaveUtmifyOrderUseCase';
import { ConvertOrderCurrencyAction } from '../actions/ConvertOrderCurrencyAction';
import { GetOrderTransactionStatusUseCase } from '../usecases/GetOrderTransactionStatusUseCase';

export class AllOffersController implements Controller {
  private readonly saveUtmifyOrderUseCase: SaveUtmifyOrderUseCase;
  private readonly getOrderTransactionStatusUseCase: GetOrderTransactionStatusUseCase;
  private readonly converterCurrency: ConvertOrderCurrencyAction;

  constructor(saveUtmifyOrderUseCase: SaveUtmifyOrderUseCase, getOrderTransactionStatusUseCase: GetOrderTransactionStatusUseCase, converterCurrency: ConvertOrderCurrencyAction) {
    this.saveUtmifyOrderUseCase = saveUtmifyOrderUseCase;
    this.getOrderTransactionStatusUseCase = getOrderTransactionStatusUseCase;
    this.converterCurrency = converterCurrency;
  }

  async handle(req: Request, res: Response): Promise<Response> {
    const body = req.body;

    const paymentMethod = this.allOffersPaymentMethodToUtmifyPaymentMethod(body.PaymentMethod);

    const transactionStatus = this.allOffersSaleStatusToUtmifyTransactionStatus(body.SaleStatus);

    const products = await this.allOffersBodyToUtmifyProduct(body);

    const customer = this.allOffersCustomerToUtmifyCustomer(body.Customer);

    const values = await this.allOffersBodyToUtmifyValues(req.body);

    const {
      transactionStatus: currentTransactionStatus,
    } = await this.getOrderTransactionStatusUseCase.execute({
      saleId: body.OrderId,
    });

    if (currentTransactionStatus && !this.isValidStatusTransition(currentTransactionStatus, transactionStatus)) {
      throw new RequestError(400, 'Invalid status transition');
    }

    await this.saveUtmifyOrderUseCase.execute({
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
        paidAt: transactionStatus === UtmifyTransactionStatus.Paid ? new Date(body.PaymentDate) : null,
        refundedAt: transactionStatus === UtmifyTransactionStatus.Refunded ? new Date(body.RefundDate) : null,
      },
      additionalInfo: {
        currency: body.Currency,
      },
    });

    return res.status(200).send();
  }

  allOffersPaymentMethodToUtmifyPaymentMethod(method: AllOffersPaymentMethod): UtmifyPaymentMethod {
    switch(method) {
    case 'Pix': return UtmifyPaymentMethod.Pix;
    case 'Boleto': return UtmifyPaymentMethod.Billet;
    case 'CreditCard': return UtmifyPaymentMethod.CreditCard;
    default: throw new RequestError(400, `Unknown payment method: ${method}`);
    }
  }

  allOffersSaleStatusToUtmifyTransactionStatus(status: AllOffersSaleStatus): UtmifyTransactionStatus {
    switch(status) {
    case 'AwaitingPayment': return UtmifyTransactionStatus.Pending;
    case 'Paid': return UtmifyTransactionStatus.Paid;
    case 'Refunded': return UtmifyTransactionStatus.Refunded;
    default: throw new RequestError(400, `Unknown payment status: ${status}`);
    }
  }

  async allOffersBodyToUtmifyProduct(body: AllOffersBody): Promise<UtmifyProduct[]> {
    const { Currency, OrderCreatedDate, Items: items } = body;
    if(Currency === 'BRL') {
      return items.map((item) => ({
        id: item.ItemId,
        name: item.ItemName,
        quantity: item.Quantity,
        priceInCents: item.UnitPrice * 100,
      }));
    }
    const convertedItems = await Promise.all(
      items.map(async (item) => {
        const convertedPrice = await this.converterCurrency.execute({
          currency: Currency,
          orderCreated: OrderCreatedDate,
          value: item.UnitPrice,
        });

        return {
          id: item.ItemId,
          name: item.ItemName,
          quantity: item.Quantity,
          priceInCents: (convertedPrice ?? 0) * 100,
        };
      }),
    );

    return convertedItems;
  }

  allOffersCustomerToUtmifyCustomer(customer: AllOffersCustomer): UtmifyCustomer {
    return {
      id: customer.Email,
      fullName: `${customer.FirstName} ${customer.LastName}`,
      email: customer.Email,
      phone: customer.Phone,
      country: customer.Country ?? null,
    };
  }

  async allOffersBodyToUtmifyValues(body: AllOffersBody): Promise<UtmifyValues> {
    if(body.Currency === 'BRL') {
      return {
        totalValueInCents: (body.TotalSaleAmount ?? 0) * 100,
        sellerValueInCents: (body.UserCommission ?? 0) * 100,
        shippingValueInCents: null,
        platformValueInCents: (body.PlatformCommission ?? 0) * 100,
      };
    } else {
      const [totalValueConverted, sellerValueConverted, platformValueConverted] = await Promise.all([
        this.converterCurrency.execute({
          currency: body.Currency,
          orderCreated: body.OrderCreatedDate,
          value: body.TotalSaleAmount,
        }),
        this.converterCurrency.execute({
          currency: body.Currency,
          orderCreated: body.OrderCreatedDate,
          value: body.UserCommission,
        }),
        this.converterCurrency.execute({
          currency: body.Currency,
          orderCreated: body.OrderCreatedDate,
          value: body.PlatformCommission,
        }),
      ]);
      return {
        totalValueInCents: (totalValueConverted ?? 0) * 100,
        sellerValueInCents: (sellerValueConverted ?? 0) * 100,
        shippingValueInCents: null,
        platformValueInCents: (platformValueConverted ?? 0) * 100,
      };
    }
  }

  isValidStatusTransition(currentStatus: UtmifyTransactionStatus, newStatus: UtmifyTransactionStatus): boolean {
    if(currentStatus === UtmifyTransactionStatus.Paid && newStatus === UtmifyTransactionStatus.Pending) {
      return false;
    }
    if(currentStatus === UtmifyTransactionStatus.Refunded && (newStatus === UtmifyTransactionStatus.Paid || newStatus === UtmifyTransactionStatus.Pending)) {
      return false;
    }
    return true;
  }
}

export type AllOffersBody = {
    WebhookId: string,
    OrderId: string,
    PaymentMethod: AllOffersPaymentMethod,
    UserCommission: number,
    TotalSaleAmount: number,
    PlatformCommission: number,
    Currency: AllOffersCurrency,
    SaleStatus: AllOffersSaleStatus,
    Customer: AllOffersCustomer,
    OrderCreatedDate: string,
    PaymentDate: string | null,
    RefundDate: string | null,
    PaymentGateway: AllOffersPaymentGateway,
    OrderNotes: string,
    CouponCode: string,
    Items: AllOffersItems
    ShippingDetails: AllOffersShippingDetails
    PaymentDetails: AllOffersPaymentDetails
}

export type AllOffersPaymentMethod = 'Boleto' | 'CreditCard' | 'Pix'

export type AllOffersCurrency = 'BRL' | 'USD' | 'EUR'

export type AllOffersSaleStatus = 'AwaitingPayment' | 'Paid' | 'Refunded'

export type AllOffersCustomer = {
    FirstName: string,
    LastName: string,
    Phone: string,
    Email: string,
    Country: string
    BillingAddress: AllOffersBillingAddress
    ShippingAddress: AllOffersShippingAddress
}

export type AllOffersBillingAddress = {
    Street: string,
    City: string,
    State: string,
    ZipCode: string,
    Country: string
}

export type AllOffersShippingAddress = {
    Street: string,
    City: string,
    State: string,
    ZipCode: string,
    Country: string
}

export type AllOffersPaymentGateway = 'Boleto' | 'CreditCard' | 'Pix'

export type AllOffersItems = {
    ItemId: string,
    ItemName: string,
    Quantity: number,
    UnitPrice: number,
    ItemCategory: string,
    ItemBrand: string,
    ItemSku: string
}[]

export type AllOffersShippingDetails = {
    ShippingMethod: AllOffersShippingMethod,
    EstimatedDeliveryDate: string,
    TrackingNumber: string | null,
    ShippingStatus: AllOffersShippingStatus
}

export type AllOffersShippingMethod = 'Express' | 'Standard'

export type AllOffersShippingStatus = 'Pending' | 'Shipped'

export type AllOffersPaymentDetails = {
    PaymentStatus: AllOffersPaymentStatus,
    PaymentMethodDetails: AllOffersMethodDetails
}

export type AllOffersPaymentStatus = 'Pending' | 'Refunded' | 'Paid'

export type AllOffersMethodDetails = {
    BoletoNumber?: string
    PixTransactionId?: string
    CardType?: string
    Last4Digits?: string
    TransactionId?: string
}
