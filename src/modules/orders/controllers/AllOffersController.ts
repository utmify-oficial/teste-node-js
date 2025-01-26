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
import { TransactionError } from '../../../core/errors/TransactionError';

export class AllOffersController implements Controller {
  private readonly usecase: SaveUtmifyOrderUseCase;

  public constructor(usecase: SaveUtmifyOrderUseCase) {
    this.usecase = usecase;
  }

  public async handle(req: Request, res: Response): Promise<Response> {
    console.log('AllOffers order received');
    console.log(JSON.stringify(req.body, null, 2));
    console.log(JSON.stringify(req.headers));

    const body = req.body as AllOffersBody;
    const paymentMethod = this.allOffersPaymentMethodToUtmifyPaymentMethod(body.PaymentMethod);
    const transactionStatus = this.allOffersStatusToUtmifyTransactionStatus(body.SaleStatus);
    const products = this.allOffersItemsToUtmifyProducts(body.Items);
    const customer = this.allOffersCustomerToUtmifyCustomer(body.Customer);
    let values = this.allOffersBodyToUtmifyValues(body);
    
    if (body.Currency != 'BRL') {
      values = await (new ConvertOrderCurrencyAction()).execute({ input_currency: body.Currency, target_currency: 'BRL', values });
    }

    try {
      await this.usecase.execute({
        data: {
          saleId: body.OrderId.toString(),
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
    } catch (e: any) {
      if (e instanceof TransactionError)
        throw new RequestError(400, e.description);
    }
    return res.status(200).send();
  }

  public allOffersPaymentMethodToUtmifyPaymentMethod(method: AllOffersPaymentMethod): UtmifyPaymentMethod {
    switch (method) {
      case 'Boleto': return UtmifyPaymentMethod.Billet;
      case 'CreditCard': return UtmifyPaymentMethod.CreditCard;
      case 'Pix': return UtmifyPaymentMethod.Pix;
      default: throw new RequestError(400, `Unknown payment method: ${method}`);
    }
  }

  public allOffersStatusToUtmifyTransactionStatus(status: AllOffersStatus): UtmifyTransactionStatus {
    switch (status) {
      case 'AwaitingPayment': return UtmifyTransactionStatus.Pending;
      case 'Paid': return UtmifyTransactionStatus.Paid;
      case 'Refunded': return UtmifyTransactionStatus.Refunded;
      default: throw new RequestError(400, `Unknown payment status: ${status}`);
    }
  }

  public allOffersItemsToUtmifyProducts(items: AllOffersItem[]): UtmifyProduct[] {
    return items.map(({ ItemId, ItemName, Quantity, UnitPrice }) => ({
      id: ItemId,
      name: ItemName,
      quantity: Quantity,
      priceInCents: UnitPrice * 100
    }));
  }

  public allOffersCustomerToUtmifyCustomer(customer: AllOffersCustomer): UtmifyCustomer {
    return {
      id: customer.Email,
      fullName: customer.FirstName + ' ' + customer.LastName,
      email: customer.Email,
      phone: customer.Phone,
      country: customer.Country
    };
  }

  public allOffersBodyToUtmifyValues(body: AllOffersBody): UtmifyValues {
    return {
      totalValueInCents: body.TotalSaleAmount * 100,
      sellerValueInCents: body.UserCommission * 100,
      platformValueInCents: body.PlatformCommission * 100,
      shippingValueInCents: null
    };
  }
}

export type AllOffersPaymentMethod = 'Boleto' | 'CreditCard' | 'Pix';
export type AllOffersStatus = 'AwaitingPayment' | 'Paid' | 'Refunded';

export type AllOffersBody = {
  WebhookId: string;
  OrderId: number,
  PaymentMethod: AllOffersPaymentMethod,
  UserCommission: number,
  TotalSaleAmount: number,
  PlatformCommission: number,
  Currency: 'BRL' | 'USD' | 'EUR',
  SaleStatus: AllOffersStatus,
  Customer: AllOffersCustomer;
  OrderCreatedDate: string;
  PaymentDate: string | null;
  RefundDate: string | null;
  PaymentGateway: AllOffersPaymentMethod;
  OrderNotes: string;
  CouponCode: string;
  Items: AllOffersItem[];
  ShippingDetails: AllOffersShippingDetails;
  PaymentDetails: AllOffersPaymentDetails;
};

export type AllOffersCustomer = {
  FirstName: string;
  LastName: string;
  Phone: string;
  Email: string;
  Country: string;
  BillingAddress: AllOffersAddress;
  ShippingAddress: AllOffersAddress;
};

export type AllOffersAddress = {
  Street: string;
  City: string;
  State: string;
  ZipCode: string;
  Country: string;
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

export type AllOffersShippingMethod = 'Express' | 'Standard';
export type AllOffersShippingStatus = 'Pending' | 'Shipped';

export type AllOffersShippingDetails = {
  ShippingMethod: AllOffersShippingMethod;
  EstimatedDeliveryDate: string;
  TrackingNumber: string | null,
  ShippingStatus: AllOffersShippingStatus;
};

export type AllOffersPaymentDetails = {
  PaymentStatus: AllOffersStatus;
  PaymentMethodDetails: AllOffersPaymentMethodDetails;
};

export type AllOffersPaymentMethodDetails = AllOffersBoletoPaymentMethodDetails | AllOffersCreditCardPaymentMethodDetails | AllOffersPixPaymentMethodDetails;

export type AllOffersBoletoPaymentMethodDetails = {
  BoletoNumber: string;
};

export type AllOffersCreditCardPaymentMethodDetails = {
  CardType: string;
  Last4Digits: number;
  TransactionId: string;
};

export type AllOffersPixPaymentMethodDetails = {
  PixTransactionId: string;
};