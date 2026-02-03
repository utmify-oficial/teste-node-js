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

export class WorldMarketController implements Controller {
  private readonly usecase: SaveUtmifyOrderUseCase;

  constructor(usecase: SaveUtmifyOrderUseCase) {
    this.usecase = usecase;
  }

  async handle(req: Request, res: Response): Promise<Response> {
    console.log('WorldMarket order received');
    console.log(JSON.stringify(req.headers, null, 2));
    console.log(JSON.stringify(req.body, null, 2));

    const body = req.body as WorldMarketBody;

    const paymentMethod = this.worldMarketPaymentMethodToUtmifyPaymentMethod(
      body.payment_details.payment_method,
    );

    const transactionStatus = this.worldMarketStatusToUtmifyTransactionStatus(
      body.order_status,
    );

    const products = this.worldMarketProductsToUtmifyProducts(body.order_details.products);

    const customer = this.worldMarketCustomerToUtmifyCustomer(body.customer);

    const values = this.worldMarketBodyToUtmifyValues(body.order_details);

    await this.usecase.execute({
      data: {
        saleId: body.order_id,
        externalWebhookId: body.webhook_id,
        platform: UtmifyIntegrationPlatform.WorldMarket,
        paymentMethod,
        transactionStatus,
        products,
        customer,
        values,
        createdAt: new Date(body.created_at),
        updatedAt: new Date(),
        paidAt: transactionStatus === UtmifyTransactionStatus.Paid ? new Date(body.payment_details.paid_at) : null,
        refundedAt: transactionStatus === UtmifyTransactionStatus.Refunded ? new Date(body.updated_at) : null,
      },
      additionalInfo: {
        currency: body.payment_details.currency,
      },
    });

    return res.status(200).send();
  }

  worldMarketPaymentMethodToUtmifyPaymentMethod(method: WorldMarketPaymentMethod): UtmifyPaymentMethod {
    switch(method) {
    case 'pix': return UtmifyPaymentMethod.Pix;
    case 'boleto': return UtmifyPaymentMethod.Billet;
    case 'credit_card': return UtmifyPaymentMethod.CreditCard;
    default: throw new RequestError(400, `Unknown payment method: ${method}`);
    }
  }

  worldMarketStatusToUtmifyTransactionStatus(status: WorldMarketStatus): UtmifyTransactionStatus {
    switch(status) {
    case 'pending': return UtmifyTransactionStatus.Pending;
    case 'approved': return UtmifyTransactionStatus.Paid;
    case 'refunded': return UtmifyTransactionStatus.Refunded;
    default: throw new RequestError(400, `Unknown payment status: ${status}`);
    }
  }

  worldMarketProductsToUtmifyProducts(products: WorldMarketProduct[]): UtmifyProduct[] {
    return products.map(({ product_id, name, quantity, price_unit }) => ({
      id: product_id,
      name,
      priceInCents: price_unit * 100,
      quantity,
    }));
  }

  worldMarketCustomerToUtmifyCustomer(customer: WorldMarketCustomer): UtmifyCustomer {
    return {
      id: customer.customer_id,
      fullName: customer.name,
      email: customer.email,
      phone: customer.phone,
      country: customer.address?.country ?? null,
    };
  }

  worldMarketBodyToUtmifyValues(orderDetails: WorldMarketOrderDetails): UtmifyValues {
    return {
      totalValueInCents: (orderDetails.total ?? 0) * 100,
      sellerValueInCents: (orderDetails.seller_fee ?? 0) * 100,
      shippingValueInCents: (orderDetails.shipping_fee ?? 0) * 100,
      platformValueInCents: (orderDetails.platform_fee ?? 0) * 100,
    };
  }
}

export type WorldMarketBody = {
  order_id: string;
  webhook_id: string;
  customer: WorldMarketCustomer;
  order_details: WorldMarketOrderDetails;
  payment_details: WorldMarketPaymentDetails;
  shipping_details: WorldMarketShippingDetails;
  order_status: WorldMarketStatus;
  created_at: string;
  updated_at: string;
  notes: string;
};

export type WorldMarketCustomer = {
  customer_id: string;
  name: string;
  email: string;
  phone: string;
  address: WorldMarketCustomerAddress;
};

export type WorldMarketCustomerAddress = {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
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

export type WorldMarketPaymentDetails = {
  payment_id: string;
  payment_method: WorldMarketPaymentMethod;
  transaction_id: string;
  pix_key: string;
  transaction_qr_code: string;
  status: WorldMarketStatus;
  expires_at?: string;
  currency: string;
  paid_at: string;
};

export type WorldMarketPaymentMethod = 'pix' | 'boleto' | 'credit_card';

export type WorldMarketStatus = 'pending' | 'approved' | 'refunded';

export type WorldMarketShippingDetails = {
  shipping_id: string;
  carrier: string;
  tracking_code: string | null;
  estimated_delivery: string;
  status: string;
};
