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
  //private readonly action: ConvertOrderCurrencyAction;

  // constructor(usecase: SaveUtmifyOrderUseCase, action: ConvertOrderCurrencyAction) {
  //   this.usecase = usecase;
  //   this.action = action;
  // }

    constructor(usecase: SaveUtmifyOrderUseCase) {
    this.usecase = usecase;
  }

  async handle(req: Request, res: Response): Promise<Response> {
    console.log('AllOffers order received');
    
    //console.log(JSON.stringify(req.body, null, 2));
    //console.log(JSON.stringify(req.headers));

    const body = req.body as AllOffersBody;

    const paymentMethod = this.allOffersPaymentMethodToUtmifyPaymentMethod(
      body.PaymentMethod,
    );

    const transactionStatus = await this.allOffersStatusToUtmifyTransactionStatus(
      body.SaleStatus, body.OrderId
    );   

    const products = this.allOffersProductsToUtmifyProducts(body.Items); 

    const customer = this.allOffersCustomerToUtmifyCustomer(body.Customer);

    const values = await this.allOffersBodyToUtmifyValues([body.TotalSaleAmount, body.UserCommission, body.PlatformCommission], body.Currency);

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

  async allOffersStatusToUtmifyTransactionStatus(status: AllOffersStatus, orderId: string): Promise<UtmifyTransactionStatus> {
    const order = await this.usecase.selectByOrderId(orderId);
    
    switch(status) {
      case 'Pending':
        if(order?.transactionStatus as unknown as UtmifyTransactionStatus === UtmifyTransactionStatus.Paid){
          throw new RequestError(400, `Can't change status ${UtmifyTransactionStatus.Paid} to ${UtmifyTransactionStatus.Pending}`);
        }
        if(order?.transactionStatus as unknown as UtmifyTransactionStatus === UtmifyTransactionStatus.Refunded){
          throw new RequestError(400, `Can't change status ${UtmifyTransactionStatus.Refunded} to ${UtmifyTransactionStatus.Pending}`);
        }
        return UtmifyTransactionStatus.Pending;
      break;
      case 'Paid':
        if(order?.transactionStatus as unknown as UtmifyTransactionStatus === UtmifyTransactionStatus.Refunded){
          throw new RequestError(400, `Can't change status ${UtmifyTransactionStatus.Refunded} to ${UtmifyTransactionStatus.Paid}`);
        }
        return UtmifyTransactionStatus.Paid;
      break;
      case 'Refunded': return UtmifyTransactionStatus.Refunded;
      default: throw new RequestError(400, `Unknown payment status: ${status}`);
    }
  }

  allOffersProductsToUtmifyProducts(products: AllOffersProduct[]): UtmifyProduct[] {
    return products.map(({ ItemId, ItemName, Quantity, UnitPrice }) => ({
      id: ItemId,
      name: ItemName,
      priceInCents: UnitPrice * 100,
      quantity: Quantity,
    }));
  }

  allOffersCustomerToUtmifyCustomer(customer: AllOffersCustomer): UtmifyCustomer {
    return {
      id: customer.Email,
      fullName: `${customer.FirstName} ${customer.LastName}`,
      email: customer.Email,
      phone: customer.Phone,
      country: customer.ShippingAddress?.Country ?? null,
    };
  }

  async allOffersBodyToUtmifyValues(orderDetails: AllOffersOrderDetails[], currency: AllOffersBody['Currency']): Promise<UtmifyValues> {
  //   if(currency === 'BRL'){
  //     return {
  //       totalValueInCents: (Number(orderDetails[0]) ?? 0) * 100,
  //       sellerValueInCents: (Number(orderDetails[1]) ?? 0) * 100,
  //       shippingValueInCents: 0,
  //       platformValueInCents: (Number(orderDetails[2]) ?? 0) * 100,
  //     };
  //   }

  //   const currencyRate: number = await this.action.execute(currency);
         
  //   return {
  //     totalValueInCents: (Number(orderDetails[0]) / currencyRate) * 100,
  //     sellerValueInCents: (Number(orderDetails[1]) / currencyRate) * 100,
  //     shippingValueInCents: 0,
  //     platformValueInCents: (Number(orderDetails[2]) / currencyRate) * 100,
  //   };
    return {
      totalValueInCents: (Number(orderDetails[0]) ?? 0) * 100,
      sellerValueInCents: (Number(orderDetails[1]) ?? 0) * 100,
      shippingValueInCents: 0,
      platformValueInCents: (Number(orderDetails[2]) ?? 0) * 100,
    };
  }
}

export type AllOffersBody = {
  OrderId: string;
  WebhookId: string;
  Customer: AllOffersCustomer;
  Items: AllOffersProduct[];
  TotalSaleAmount: AllOffersOrderDetails;
  UserCommission: AllOffersOrderDetails;
  PlatformCommission: AllOffersOrderDetails;
  PaymentMethod: AllOffersPaymentMethod;
  PaymentDetails: AllOffersPaymentDetails;
  PaymentDate: string;
  ShippingDetails: AllOffersShippingDetails;
  SaleStatus: AllOffersStatus;
  Currency: string;
  OrderCreatedDate: string;
  RefundDate: string;
  OrderNotes: string;
};

export type AllOffersCustomer = {
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  ShippingAddress: AllOffersCustomerAddress;
};

export type AllOffersCustomerAddress = {
  Street: string;
  City: string;
  State: string;
  ZipCode: string;
  Country?: string;
};

export type AllOffersOrderDetails = {
  TotalSaleAmount: number;
  PlatformCommission: number;
  UserCommission: number;
};

export type AllOffersProduct = {
  ItemId: string;
  ItemName: string;
  ItemBrand: string;
  Category: string;
  Quantity: number;
  UnitPrice: number;
};

export type AllOffersPaymentDetails = {
  TransactionId: string;
  PaymentStatus: AllOffersStatus;
};

export type AllOffersPaymentMethod = 'Pix' | 'Boleto' | 'CreditCard';

export type AllOffersStatus = 'Pending' | 'Paid' | 'Refunded';

export type AllOffersShippingDetails = {
  ShippingMethod: string;
  TrackingNumber: string | null;
  EstimatedDeliveryDate: string;
  ShippingStatus: string;
};
