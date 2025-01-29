import { Request, Response } from 'express';
import { UtmifyOrdersRepositoryMongoose } from '../../repositories/implementations/UtmifyOrdersRepositoryMongoose';
import { UtmifyCustomer } from '../../types/UtmifyCustomer';
import { UtmifyPaymentMethod } from '../../types/UtmifyPaymentMethod';
import { UtmifyProduct } from '../../types/UtmifyProduct';
import { UtmifyTransactionStatus } from '../../types/UtmifyTransactionStatus';
import { UtmifyValues } from '../../types/UtmifyValues';
import { SaveUtmifyOrderUseCase } from '../../usecases/SaveUtmifyOrderUseCase';
import { AllOffersBody } from '../../types/AllOffers';
import { AllOffersController } from '../AllOffersController';
import { AllOffersTransformationService } from '../../services/AllOffersTransformationService';
import { ConvertOrderCurrencyAction, ConvertOrderCurrencyActionOutput } from '../../actions/ConvertOrderCurrencyAction';
import { AllOffersOrderValidationService } from '../../services/AllOffersOrderValidationService';
import { UtmifyIntegrationPlatform } from '../../types/UtmifyIntegrationPlatform';
import { Types } from 'mongoose';

describe('AllOffersController', () => {
  let repository: UtmifyOrdersRepositoryMongoose;
  let usecase: SaveUtmifyOrderUseCase;
  let transformationService: AllOffersTransformationService;
  let currencyConverter: ConvertOrderCurrencyAction;
  let orderValidationService: AllOffersOrderValidationService;
  let controller: AllOffersController;

  beforeEach(() => {
    repository = new UtmifyOrdersRepositoryMongoose();
    usecase = new SaveUtmifyOrderUseCase(repository);
    transformationService = new AllOffersTransformationService();
    currencyConverter = new ConvertOrderCurrencyAction();
    orderValidationService = new AllOffersOrderValidationService();
    controller = new AllOffersController(
      usecase,
      transformationService,
      currencyConverter,
      repository,
      orderValidationService,
    );
  });

  describe('order status validation', () => {
    it('should throw error when trying to update paid order to pending', async () => {
      // Setup
      const existingOrder = {
        _id: new Types.ObjectId(),
        saleId: '123',
        externalWebhookId: 'webhook_123',
        platform: UtmifyIntegrationPlatform.AllOffers,
        paymentMethod: UtmifyPaymentMethod.Pix,
        transactionStatus: UtmifyTransactionStatus.Paid,
        products: [] as UtmifyProduct[],
        customer: {
          id: 'customer_123',
          fullName: 'Test Customer',
          email: 'test@example.com',
          phone: '1234567890',
          country: 'US',
        } as UtmifyCustomer,
        values: {
          totalValueInCents: 10000,
          sellerValueInCents: 8000,
          platformValueInCents: 1000,
          shippingValueInCents: 0,
        } as UtmifyValues,
        createdAt: new Date(),
        updatedAt: new Date(),
        paidAt: new Date(),
        refundedAt: null,
      };

      const body: AllOffersBody = {
        OrderId: '123',
        SaleStatus: 'AwaitingPayment',
        WebhookId: 'webhook_123',
        PaymentMethod: 'Pix',
        Currency: 'BRL',
        Customer: {
          FirstName: 'Test',
          LastName: 'Customer',
          Email: 'test@example.com',
          Phone: '1234567890',
          Country: 'US',
          BillingAddress: {
            Street: 'Test St',
            City: 'Test City',
            State: 'TS',
            ZipCode: '12345',
            Country: 'US',
          },
          ShippingAddress: {
            Street: 'Test St',
            City: 'Test City',
            State: 'TS',
            ZipCode: '12345',
            Country: 'US',
          },
        },
        Items: [],
        ShippingDetails: {
          ShippingMethod: 'Test',
          EstimatedDeliveryDate: '2025-01-26T10:00:00Z',
          TrackingNumber: null,
          ShippingStatus: 'Pending',
        },
        PaymentDetails: {
          PaymentStatus: 'AwaitingPayment',
          PaymentMethodDetails: {
            PixTransactionId: '123',
          },
        },
        OrderCreatedDate: new Date().toISOString(),
        PaymentGateway: 'Pix',
        OrderNotes: '',
        CouponCode: '',
        PaymentDate: null,
        RefundDate: null,
        UserCommission: 0,
        TotalSaleAmount: 0,
        PlatformCommission: 0,
      };

      jest.spyOn(repository, 'findBySaleId').mockResolvedValue(existingOrder);
      jest.spyOn(transformationService, 'transformTransactionStatus')
        .mockReturnValue(UtmifyTransactionStatus.Pending);

      // Act & Assert
      await expect(controller.handle(
        { body } as Request,
        {} as Response,
      )).rejects.toThrow('Paid orders cannot be updated to pending status');
    });

    it('should throw error when trying to update refunded order to paid', async () => {
      // Setup
      const existingOrder = {
        _id: new Types.ObjectId(),
        saleId: '123',
        externalWebhookId: 'webhook_123',
        platform: UtmifyIntegrationPlatform.AllOffers,
        paymentMethod: UtmifyPaymentMethod.Pix,
        transactionStatus: UtmifyTransactionStatus.Refunded,
        products: [] as UtmifyProduct[],
        customer: {
          id: 'customer_123',
          fullName: 'Test Customer',
          email: 'test@example.com',
          phone: '1234567890',
          country: 'US',
        } as UtmifyCustomer,
        values: {
          totalValueInCents: 10000,
          sellerValueInCents: 8000,
          platformValueInCents: 1000,
          shippingValueInCents: 0,
        } as UtmifyValues,
        createdAt: new Date(),
        updatedAt: new Date(),
        paidAt: new Date(),
        refundedAt: new Date(),
      };

      const body: AllOffersBody = {
        OrderId: '123',
        SaleStatus: 'Paid',
        WebhookId: 'webhook_123',
        PaymentMethod: 'Pix',
        Currency: 'BRL',
        Customer: {
          FirstName: 'Test',
          LastName: 'Customer',
          Email: 'test@example.com',
          Phone: '1234567890',
          Country: 'US',
          BillingAddress: {
            Street: 'Test St',
            City: 'Test City',
            State: 'TS',
            ZipCode: '12345',
            Country: 'US',
          },
          ShippingAddress: {
            Street: 'Test St',
            City: 'Test City',
            State: 'TS',
            ZipCode: '12345',
            Country: 'US',
          },
        },
        Items: [],
        ShippingDetails: {
          ShippingMethod: 'Test',
          EstimatedDeliveryDate: '2025-01-26T10:00:00Z',
          TrackingNumber: null,
          ShippingStatus: 'Pending',
        },
        PaymentDetails: {
          PaymentStatus: 'Paid',
          PaymentMethodDetails: {
            PixTransactionId: '123',
          },
        },
        OrderCreatedDate: new Date().toISOString(),
        PaymentGateway: 'Pix',
        OrderNotes: '',
        CouponCode: '',
        PaymentDate: new Date().toISOString(),
        RefundDate: null,
        UserCommission: 0,
        TotalSaleAmount: 0,
        PlatformCommission: 0,
      };

      jest.spyOn(repository, 'findBySaleId').mockResolvedValue(existingOrder);
      jest.spyOn(transformationService, 'transformTransactionStatus')
        .mockReturnValue(UtmifyTransactionStatus.Paid);

      // Act & Assert
      await expect(controller.handle(
        { body } as Request,
        {} as Response,
      )).rejects.toThrow('Refunded orders cannot be updated to paid or pending status');
    });
  });
});
