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
import { AllOffersItem } from '../types/AllOffersItem';
import { AllOffersBody } from '../types/AllOffersBody';
import { AllOffersCustomer } from '../types/AllOffersCustomer';

export class AllOffersController implements Controller {
  private readonly usecase: SaveUtmifyOrderUseCase;
  private readonly convertOrderCurrencyAction: ConvertOrderCurrencyAction;

  constructor(usecase: SaveUtmifyOrderUseCase, convertOrderCurrencyAction: ConvertOrderCurrencyAction) {
    this.usecase = usecase;
    this.convertOrderCurrencyAction = convertOrderCurrencyAction;
  }

  async handle(req: Request, res: Response): Promise<Response> {
    const body = req.body as AllOffersBody;

    const paymentMethod = this.allOffersPaymentMethodToUtmifyPaymentMethod(body.PaymentMethod);
    const transactionStatus = this.allOffersStatusToUtmifyTransactionStatus(body.SaleStatus);
    const products = this.allOffersProductsToUtmifyProducts(body.Items);
    const customer = this.allOffersCustomerToUtmifyCustomer(body.Customer);
    const values = await this.allOffersBodyToUtmifyValues(body);

    await this.usecase.execute({
      data: {
        saleId: body.OrderId,
        externalWebhookId: body.WebhookId,
        platform: UtmifyIntegrationPlatform.WorldMarket,
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

  allOffersPaymentMethodToUtmifyPaymentMethod(method: string): UtmifyPaymentMethod {
    switch (method.toLowerCase()) {
      case 'pix': return UtmifyPaymentMethod.Pix;
      case 'boleto': return UtmifyPaymentMethod.Billet;
      case 'creditcard': return UtmifyPaymentMethod.CreditCard;
      default: throw new RequestError(400, `Unknown payment method: ${method}`);
    }
  }

  allOffersStatusToUtmifyTransactionStatus(status: string): UtmifyTransactionStatus {
    switch (status.toLowerCase()) {
      case 'awaitingpayment': return UtmifyTransactionStatus.Pending;
      case 'paid': return UtmifyTransactionStatus.Paid;
      case 'refunded': return UtmifyTransactionStatus.Refunded;
      default: throw new RequestError(400, `Unknown sale status: ${status}`);
    }
  }

  allOffersProductsToUtmifyProducts(items: AllOffersItem[]): UtmifyProduct[] {
    return items.map(({ ItemId, ItemName, Quantity, UnitPrice }) => ({
      id: ItemId,
      name: ItemName,
      priceInCents: UnitPrice * 100,
      quantity: Quantity,
    }));
  }

  allOffersCustomerToUtmifyCustomer(customer: AllOffersCustomer): UtmifyCustomer {
    return {
      id: customer.CustomerId,
      fullName: `${customer.FirstName} ${customer.LastName}`,
      email: customer.Email,
      phone: customer.Phone,
      country: customer.Country,
    };
  }

  async allOffersBodyToUtmifyValues(body: AllOffersBody): Promise<UtmifyValues> {
    const totalValueInCents = convertToBRL(body.TotalSaleAmount, body.Currency);
    const sellerValueInCents = convertToBRL(body.UserCommission, body.Currency);
    const platformValueInCents = convertToBRL(body.PlatformCommission, body.Currency);
  
    return {
      totalValueInCents,
      sellerValueInCents,
      platformValueInCents,
      shippingValueInCents: body.ShippingDetails.ShippingFee * 100,
    };
  }
}

function convertToBRL(amount: number, currency: string): number {
    switch (currency) {
        case 'USD':
            return amount * 5.2; // Example conversion rate
        case 'EUR':
            return amount * 6.1; // Example conversion rate
        case 'BRL':
        default:
            return amount;
    }
}
