/* eslint-disable no-console */
import { Request, Response } from 'express';
import { Controller } from '../../../core/interfaces/Controller';
import { SaveUtmifyOrderUseCase } from '../usecases/SaveUtmifyOrderUseCase';
import { UtmifyTransactionStatus } from '../types/UtmifyTransactionStatus';
import { UtmifyIntegrationPlatform } from '../types/UtmifyIntegrationPlatform';
import { AllOffersTransformationService } from '../services/AllOffersTransformationService';
import { AllOffersBody } from '../types/AllOffers';
import { ConvertOrderCurrencyAction } from '../actions/ConvertOrderCurrencyAction';

export class AllOffersController implements Controller {
  private readonly usecase: SaveUtmifyOrderUseCase;
  private readonly transformationService: AllOffersTransformationService;
  private readonly currencyConverter: ConvertOrderCurrencyAction;

  constructor(
    usecase: SaveUtmifyOrderUseCase,
    transformationService: AllOffersTransformationService,
    currencyConverter: ConvertOrderCurrencyAction,
  ) {
    this.usecase = usecase;
    this.transformationService = transformationService;
    this.currencyConverter = currencyConverter;

  }

  async handle(req: Request, res: Response): Promise<Response> {
    console.log('AllOffers order received');
    console.log(JSON.stringify(req.body, null, 2));

    const body = req.body as AllOffersBody;

    const paymentMethod = this.transformationService.transformPaymentMethod(body.PaymentMethod);
    const transactionStatus = this.transformationService.transformTransactionStatus(body.SaleStatus);
    const customer = this.transformationService.transformCustomer(body.Customer);

    const utmifyValues = this.transformationService.transformValues({
      Items: body.Items,
      TotalSaleAmount: body.TotalSaleAmount,
      UserCommission: body.UserCommission,
      PlatformCommission: body.PlatformCommission,
    });

    // Garante que não há valores nulos antes da conversão
    const valuesToConvert = {
      totalValueInCents: utmifyValues.totalValueInCents,
      sellerValueInCents: utmifyValues.sellerValueInCents,
      platformValueInCents: utmifyValues.platformValueInCents,
      shippingValueInCents: utmifyValues.shippingValueInCents ?? 0, // Garante um número
    };

    // Depois converte a moeda se necessário
    const { convertedValues, convertedItems } = await this.currencyConverter.execute({
      originalCurrency: body.Currency,
      values: valuesToConvert,
      items: body.Items,
    });

    const products = this.transformationService.transformProducts(convertedItems);

    await this.usecase.execute({
      data: {
        saleId: body.OrderId,
        externalWebhookId: body.WebhookId,
        platform: UtmifyIntegrationPlatform.AllOffers,
        paymentMethod,
        transactionStatus,
        products,
        customer,
        values: convertedValues,
        createdAt: new Date(body.OrderCreatedDate),
        updatedAt: new Date(),
        paidAt: transactionStatus === UtmifyTransactionStatus.Paid && body.PaymentDate
          ? new Date(body.PaymentDate)
          : null,
        refundedAt: transactionStatus === UtmifyTransactionStatus.Refunded && body.RefundDate
          ? new Date(body.RefundDate)
          : null,
      },
      additionalInfo: {
        currency: body.Currency,
      },
    });

    return res.status(200).send();
  }
}
