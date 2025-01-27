import { RequestError } from '../../../../core/errors/RequestError';
import { UtmifyOrdersRepositoryMongoose } from '../../repositories/implementations/UtmifyOrdersRepositoryMongoose';
import { UtmifyCustomer } from '../../types/utmify/UtmifyCustomer';
import { UtmifyPaymentMethod } from '../../types/utmify/UtmifyPaymentMethod';
import { UtmifyProduct } from '../../types/utmify/UtmifyProduct';
import { UtmifyTransactionStatus } from '../../types/utmify/UtmifyTransactionStatus';
import { UtmifyValues } from '../../types/utmify/UtmifyValues';
import { SaveUtmifyOrderUseCase, SaveUtmifyOrderUseCaseInput } from '../../usecases/SaveUtmifyOrderUseCase';
import { WorldMarketController } from '../WorldMarketController';
import { WorldMarketOrder } from '../../types/worldMarket/WorldMarketOrder';
import { WorldMarketCustomer } from '../../types/worldMarket/WorldMarketCustomer';
import { WorldMarketOrderDetails } from '../../types/worldMarket/WorldMarketOrder';
import { WorldMarketProduct } from '../../types/worldMarket/WorldMarketProduct';
import { App } from '../../../../server/App';
import { UtmifyIntegrationPlatform } from '../../types/utmify/UtmifyIntegrationPlatform';
import { Request, Response } from 'express';

const repository = new UtmifyOrdersRepositoryMongoose();
const usecase = new SaveUtmifyOrderUseCase(repository);
const controller = new WorldMarketController(usecase);

afterEach(() => App.close());

describe('handle', () => {
  it('should call usecase with correct params', async () => {
    const body: WorldMarketOrder = {
      order_id: '876543210',
      webhook_id: 'wh_112233445',
      customer: {
        customer_id: 'cust_003210',
        name: 'Lucas Mendes',
        email: 'lucas.mendes@email.com',
        phone: '+55 62 91234-5678',
        address: {
          street: 'Rua das Palmeiras',
          number: '789',
          neighborhood: 'Setor Bueno',
          city: 'Goiânia',
          state: 'GO',
          postal_code: '74000-000',
          country: 'BR',
        },
      },
      order_details: {
        products: [
          {
            product_id: 'prod_401',
            name: 'Smartphone Android',
            category: 'Eletrônicos',
            quantity: 1,
            price_unit: 1299.90,
            total_price: 1299.90,
          },
          {
            product_id: 'prod_402',
            name: 'Película de Vidro',
            category: 'Acessórios',
            quantity: 1,
            price_unit: 39.90,
            total_price: 39.90,
          },
        ],
        total: 1369.80,
        shipping_fee: 20.00,
        platform_fee: 68.49,
        seller_fee: 1281.31,
      },
      payment_details: {
        payment_id: 'pay_556677889',
        payment_method: 'pix',
        pix_key: 'pix.lucas@email.com',
        transaction_id: 'tx_987654321',
        transaction_qr_code: 'https://pix.bank.com/qr-code/876543210',
        status: 'approved',
        paid_at: '2025-01-24T14:15:00Z',
        currency: 'BRL',
      },
      shipping_details: {
        shipping_id: 'ship_55667788',
        carrier: 'Correios',
        tracking_code: 'BR987654321AA',
        estimated_delivery: '2025-01-30',
        status: 'processing',
      },
      order_status: 'approved',
      created_at: '2025-01-24T14:00:00Z',
      updated_at: '2025-01-24T14:15:30Z',
      notes: 'Pagamento confirmado via PIX. O pedido está em processamento para envio.',
    };

    const mockedMethod = UtmifyPaymentMethod.Pix;
    jest.spyOn(controller, 'worldMarketPaymentMethodToUtmifyPaymentMethod').mockReturnValueOnce(mockedMethod);

    const mockedStatus = UtmifyTransactionStatus.Paid;
    jest.spyOn(controller, 'worldMarketStatusToUtmifyTransactionStatus').mockReturnValueOnce(mockedStatus);

    const mockedProducts: UtmifyProduct[] = [];
    jest.spyOn(controller, 'worldMarketProductsToUtmifyProducts').mockReturnValueOnce(mockedProducts);

    const mockedCustomer: UtmifyCustomer = {
      country: 'country',
      email: 'email',
      fullName: 'fullName',
      id: 'id',
      phone: 'phone',
    };
    jest.spyOn(controller, 'worldMarketCustomerToUtmifyCustomer').mockReturnValueOnce(mockedCustomer);

    const mockedValues: UtmifyValues = {
      platformValueInCents: 0,
      sellerValueInCents: 0,
      shippingValueInCents: 0,
      totalValueInCents: 0,
    };
    jest.spyOn(controller, 'worldMarketBodyToUtmifyValues').mockReturnValueOnce(mockedValues);

    jest.spyOn(usecase, 'execute').mockResolvedValueOnce();

    const mockedExpressRes = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const res = await controller.handle({ body } as Request, mockedExpressRes as unknown as Response);

    expect(res).toBe(mockedExpressRes.status(200).send());

    expect(controller.worldMarketPaymentMethodToUtmifyPaymentMethod).toHaveBeenCalledTimes(1);
    expect(controller.worldMarketStatusToUtmifyTransactionStatus).toHaveBeenCalledTimes(1);
    expect(controller.worldMarketProductsToUtmifyProducts).toHaveBeenCalledTimes(1);
    expect(controller.worldMarketCustomerToUtmifyCustomer).toHaveBeenCalledTimes(1);
    expect(controller.worldMarketBodyToUtmifyValues).toHaveBeenCalledTimes(1);
    expect(usecase.execute).toHaveBeenCalledTimes(1);

    expect(usecase.execute).toHaveBeenCalledWith({
      data: {
        saleId: body.order_id,
        externalWebhookId: body.webhook_id,
        platform: UtmifyIntegrationPlatform.WorldMarket,
        paymentMethod: mockedMethod,
        transactionStatus: mockedStatus,
        products: mockedProducts,
        customer: mockedCustomer,
        values: mockedValues,
        createdAt: new Date(body.created_at),
        updatedAt: expect.any(Date),
        paidAt: new Date(body.payment_details.paid_at),
        refundedAt: null,
      },
      additionalInfo: {
        currency: body.payment_details.currency,
      },
    } as SaveUtmifyOrderUseCaseInput);

    expect(controller.worldMarketPaymentMethodToUtmifyPaymentMethod)
      .toHaveBeenCalledWith(body.payment_details.payment_method);
    expect(controller.worldMarketStatusToUtmifyTransactionStatus).toHaveBeenCalledWith(body.order_status);
    expect(controller.worldMarketProductsToUtmifyProducts).toHaveBeenCalledWith(body.order_details.products);
    expect(controller.worldMarketCustomerToUtmifyCustomer).toHaveBeenCalledWith(body.customer);
    expect(controller.worldMarketBodyToUtmifyValues).toHaveBeenCalledWith(body.order_details);
  });
});

describe('worldMarketPaymentMethodToUtmifyPaymentMethod', () => {
  it('should return correct utmify payment method', () => {
    expect(controller.worldMarketPaymentMethodToUtmifyPaymentMethod('pix'))
      .toBe(UtmifyPaymentMethod.Pix);

    expect(controller.worldMarketPaymentMethodToUtmifyPaymentMethod('boleto'))
      .toBe(UtmifyPaymentMethod.Billet);

    expect(controller.worldMarketPaymentMethodToUtmifyPaymentMethod('credit_card'))
      .toBe(UtmifyPaymentMethod.CreditCard);
  });

  it('should throw request error if method is invalid', () => {
    const method = 'any other' as any;

    try {
      controller.worldMarketPaymentMethodToUtmifyPaymentMethod(method);
    } catch (e) {
      expect(e).toEqual(new RequestError(400, `Unknown payment method: ${method}`));
    }
  });
});

describe('worldMarketStatusToUtmifyTransactionStatus', () => {
  it('should return correct utmify transaction status', () => {
    expect(controller.worldMarketStatusToUtmifyTransactionStatus('pending'))
      .toBe(UtmifyTransactionStatus.Pending);

    expect(controller.worldMarketStatusToUtmifyTransactionStatus('approved'))
      .toBe(UtmifyTransactionStatus.Paid);

    expect(controller.worldMarketStatusToUtmifyTransactionStatus('refunded'))
      .toBe(UtmifyTransactionStatus.Refunded);
  });

  it('should throw request error if method is invalid', () => {
    const status = 'any other' as any;

    try {
      controller.worldMarketStatusToUtmifyTransactionStatus(status);
    } catch (e) {
      expect(e).toEqual(new RequestError(400, `Unknown payment status: ${status}`));
    }
  });
});

describe('worldMarketProductsToUtmifyProducts', () => {
  it('should return correct utmify products', () => {
    const worldMarketProducts: WorldMarketProduct[] = [
      {
        name: 'T-Shirt',
        category: 'clothes',
        price_unit: 97.00,
        product_id: '12k3hkahsd',
        quantity: 1,
        total_price: 97.00,
      },
      {
        name: 'Pants',
        category: 'clothes',
        price_unit: 119.90,
        product_id: '12k3hkahsh',
        quantity: 2,
        total_price: 239.80,
      },
    ];

    expect(controller.worldMarketProductsToUtmifyProducts(worldMarketProducts)).toEqual([
      {
        id: '12k3hkahsd',
        name: 'T-Shirt',
        priceInCents: 100 * 97.00,
        quantity: 1,
      },
      {
        id: '12k3hkahsh',
        name: 'Pants',
        priceInCents: 100 * 119.90,
        quantity: 2,
      },
    ] as UtmifyProduct[]);
  });
});

describe('worldMarketCustomerToUtmifyCustomer', () => {
  it('should return correct utmify customer', () => {
    const worldMarketCustomer: WorldMarketCustomer = {
      customer_id: 'cust_009876',
      name: 'Fernanda Costa',
      email: 'fernanda.costa@email.com',
      phone: '+55 11 95678-4321',
      address: {
        street: 'Avenida Central',
        number: '1234',
        neighborhood: 'Vila Nova',
        city: 'São Paulo',
        state: 'SP',
        postal_code: '04567-000',
        country: 'BR',
      },
    };

    expect(controller.worldMarketCustomerToUtmifyCustomer(worldMarketCustomer)).toEqual({
      id: worldMarketCustomer.customer_id,
      fullName: worldMarketCustomer.name,
      email: worldMarketCustomer.email,
      phone: worldMarketCustomer.phone,
      country: worldMarketCustomer.address.country,
    } as UtmifyCustomer);
  });
});

describe('worldMarketBodyToUtmifyValues', () => {
  it('should return correct utmify values', () => {
    const orderDetails: WorldMarketOrderDetails = {
      products: [],
      total: 924.90,
      shipping_fee: 25.00,
      platform_fee: 46.24,
      seller_fee: 853.66,
    };

    expect(controller.worldMarketBodyToUtmifyValues(orderDetails)).toEqual({
      totalValueInCents: 100 * orderDetails.total,
      sellerValueInCents: 100 * orderDetails.seller_fee,
      platformValueInCents: 100 * orderDetails.platform_fee,
      shippingValueInCents: 100 * orderDetails.shipping_fee,
    } as UtmifyValues);
  });
});
