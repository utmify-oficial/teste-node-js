/* eslint-disable no-console */
import { Request, Response } from 'express';
import { Controller } from '../../../core/interfaces/Controller';
import { SaveUtmifyOrderUseCase } from '../usecases/SaveUtmifyOrderUseCase';
import { UtmifyPaymentMethod } from '../types/utimify/UtmifyPaymentMethod';
import { UtmifyTransactionStatus } from '../types/utimify/UtmifyTransactionStatus';
import { UtmifyProduct } from '../types/utimify/UtmifyProduct';
import { UtmifyCustomer } from '../types/utimify/UtmifyCustomer';
import { UtmifyValues } from '../types/utimify/UtmifyValues';
import { UtmifyIntegrationPlatform } from '../types/utimify/UtmifyIntegrationPlatform';
import { RequestError } from '../../../core/errors/RequestError';
import { randomUUID } from 'node:crypto';
import { AllOffersOrder } from '../types/allOffers/AllOffersOrder';
import { AllOffersCustomer } from '../types/allOffers/AllOffersCustomer';
import { AllOffersOrderItem } from '../types/allOffers/AllOffersProduct';
import { AllOffersSaleStatus } from '../types/allOffers/AllOffersTransactionStatus';
import { AllOfferPaymentMethod } from '../types/allOffers/AllOffersPaymentMethod';
import { ConvertOrderCurrencyAction } from '../actions/ConvertOrderCurrencyAction';

export class AllOffersController implements Controller {
  private readonly usecase: SaveUtmifyOrderUseCase;
  private convertOrderCurrencyAction: ConvertOrderCurrencyAction;

  constructor(usecase: SaveUtmifyOrderUseCase) {
    this.usecase = usecase;
    this.convertOrderCurrencyAction = new ConvertOrderCurrencyAction();
  }

  async handle(req: Request, res: Response): Promise<Response> {
    console.log('AllOffers order received');
    console.log(JSON.stringify(req.body, null, 2));
    console.log(JSON.stringify(req.headers));

    const body = req.body as AllOffersOrder;

    const paymentMethod = this.AllOffersPaymentMethodToUtmifyPaymentMethod(
      body.PaymentMethod,
    );

    const transactionStatus = this.AllOffersStatusToUtmifyTransactionStatus(
      body.SaleStatus,
    );

    const products = this.AllOffersProductsToUtmifyProducts(body.Items);

    const customer = this.AllOffersCustomerToUtmifyCustomer(body.Customer);

    const values = await this.AllOffersBodyToUtmifyValues(body);

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
        paidAt: transactionStatus === UtmifyTransactionStatus.Paid ? new Date(body.PaymentDate as string) : null,
        refundedAt: transactionStatus === UtmifyTransactionStatus.Refunded
          ? new Date(body.RefundDate as string) : null,
      },
      additionalInfo: {
        currency: 'BRL',
      },
    });

    return res.status(200).send();
  }

  AllOffersPaymentMethodToUtmifyPaymentMethod(method: AllOfferPaymentMethod): UtmifyPaymentMethod {
    switch(method) {
    case 'Pix': return UtmifyPaymentMethod.Pix;
    case 'Boleto': return UtmifyPaymentMethod.Billet;
    case 'CreditCard': return UtmifyPaymentMethod.CreditCard;
    default: throw new RequestError(400, `Unknown payment method: ${method}`);
    }
  }

  AllOffersStatusToUtmifyTransactionStatus(status: AllOffersSaleStatus)
  : UtmifyTransactionStatus {
    switch(status) {
    case 'AwaitingPayment': return UtmifyTransactionStatus.Pending;
    case 'Paid': return UtmifyTransactionStatus.Paid;
    case 'Refunded': return UtmifyTransactionStatus.Refunded;
    default: throw new RequestError(400, `Unknown payment status: ${status}`);
    }
  }

  AllOffersProductsToUtmifyProducts(products: AllOffersOrderItem[]): UtmifyProduct[] {
    return products.map(({ ItemId, ItemName, Quantity, UnitPrice }) => ({
      id: ItemId,
      name: ItemName,
      priceInCents: UnitPrice * 100,
      quantity: Quantity,
    }));
  }

  AllOffersCustomerToUtmifyCustomer(customer: AllOffersCustomer): UtmifyCustomer {
    return {
      id: randomUUID(),
      fullName: `${customer.FirstName} ${customer.LastName}`,
      email: customer.Email,
      phone: customer.Phone,
      country: customer.BillingAddress?.Country ?? null,
    };
  }

  async AllOffersBodyToUtmifyValues(orderDetails: AllOffersOrder): Promise<UtmifyValues> {
    return {
      totalValueInCents: (await this.convertOrderCurrencyAction.execute(
        { currency: orderDetails.Currency, value: orderDetails.TotalSaleAmount },
      )
    ?? 0) * 100,
      sellerValueInCents: (await this.convertOrderCurrencyAction.execute(
        { currency: orderDetails.Currency, value: orderDetails.UserCommission },
      ) ?? 0) * 100,
      shippingValueInCents: null,
      platformValueInCents: (await this.convertOrderCurrencyAction.execute(
        { currency: orderDetails.Currency, value: orderDetails.PlatformCommission },
      ) ?? 0) * 100,
    };
  }
}
