export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Utimify',
      version: '1.0.0',
      description: 'API Utimify documentation',
    },
    server:
    {
      url: 'http://localhost:3333',
      description: 'Servidor local',
    },
    paths: {
      '/webhooks/world-market': {
        post: {
          summary: 'Create a new WorldMarket order',
          description: 'Creates a new order with the provided details',
          tags: ['Platforms'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    order_id: {
                      type: 'string',
                    },
                    webhook_id: {
                      type: 'string',
                    },
                    customer: {
                      type: 'object',
                      properties: {
                        customer_id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        phone: { type: 'string' },
                        address: {
                          type: 'object',
                          properties: {
                            street: { type: 'string' },
                            number: { type: 'string' },
                            neighborhood: { type: 'string' },
                            city: { type: 'string' },
                            state: { type: 'string' },
                            postal_code: { type: 'string' },
                            country: { type: 'string', nullable: true },
                          },
                        },
                      },
                    },
                    order_details: {
                      type: 'object',
                      properties: {
                        products: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              product_id: { type: 'string' },
                              quantity: { type: 'number' },
                              price: { type: 'number' },
                            },
                          },
                        },
                        total: { type: 'number' },
                        shipping_fee: { type: 'number' },
                        platform_fee: { type: 'number' },
                        seller_fee: { type: 'number' },
                      },
                    },
                    payment_details: {
                      type: 'object',
                      properties: {
                        payment_id: { type: 'string' },
                        payment_method: { type: 'string', enum: ['pix', 'boleto', 'credit_card'] },
                        transaction_id: { type: 'string' },
                        pix_key: { type: 'string' },
                        transaction_qr_code: { type: 'string' },
                        status: { type: 'string', enum: ['pending', 'approved', 'refunded'] },
                        currency: { type: 'string' },
                        paid_at: { type: 'string', format: 'date-time' },
                      },
                    },
                    shipping_details: {
                      type: 'object',
                      properties: {
                        shipping_id: { type: 'string' },
                        carrier: { type: 'string' },
                        tracking_code: { type: 'string', nullable: true },
                        estimated_delivery: { type: 'string', format: 'date-time' },
                        status: { type: 'string' },
                      },
                    },
                    order_status: {
                      type: 'string',
                      enum: ['pending', 'approved', 'refunded'],
                    },
                    created_at: {
                      type: 'string',
                      format: 'date-time',
                    },
                    updated_at: {
                      type: 'string',
                      format: 'date-time',
                    },
                    notes: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Order successfully created',
            },
            400: {
              description: 'Invalid input',
            },
          },
        },
      },
      '/webhooks/all-offers': {
        post: {
          summary: 'Create a new AllOffers order',
          description: 'Creates a new order for the AllOffers platform with the provided details',
          tags: ['Platforms'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    WebhookId: {
                      type: 'string',
                    },
                    OrderId: {
                      type: 'string',
                    },
                    PaymentMethod: {
                      type: 'string',
                      enum: ['Boleto', 'CreditCard', 'Pix'],
                    },
                    UserCommission: {
                      type: 'number',
                    },
                    TotalSaleAmount: {
                      type: 'number',
                    },
                    PlatformCommission: {
                      type: 'number',
                    },
                    Currency: {
                      type: 'string',
                      enum: ['EUR', 'USD', 'BRL'],
                    },
                    SaleStatus: {
                      type: 'string',
                      enum: ['AwaitingPayment', 'Paid', 'Refunded', 'Canceled'],
                    },
                    Customer: {
                      type: 'object',
                      properties: {
                        FirstName: { type: 'string' },
                        LastName: { type: 'string' },
                        Phone: { type: 'string' },
                        Email: { type: 'string' },
                        Country: { type: 'string' },
                        BillingAddress: {
                          type: 'object',
                          properties: {
                            Street: { type: 'string' },
                            City: { type: 'string' },
                            State: { type: 'string' },
                            ZipCode: { type: 'string' },
                            Country: { type: 'string' },
                          },
                        },
                        ShippingAddress: {
                          type: 'object',
                          properties: {
                            Street: { type: 'string' },
                            City: { type: 'string' },
                            State: { type: 'string' },
                            ZipCode: { type: 'string' },
                            Country: { type: 'string' },
                          },
                        },
                      },
                    },
                    OrderCreatedDate: {
                      type: 'string',
                      format: 'date-time',
                    },
                    PaymentDate: {
                      type: 'string',
                      nullable: true,
                      format: 'date-time',
                    },
                    RefundDate: {
                      type: 'string',
                      nullable: true,
                      format: 'date-time',
                    },
                    PaymentGateway: {
                      type: 'string',
                    },
                    OrderNotes: {
                      type: 'string',
                    },
                    CouponCode: {
                      type: 'string',
                      nullable: true,
                    },
                    Items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          ItemId: { type: 'string' },
                          ItemName: { type: 'string' },
                          Quantity: { type: 'number' },
                          UnitPrice: { type: 'number' },
                          ItemCategory: { type: 'string' },
                          ItemBrand: { type: 'string' },
                          ItemSku: { type: 'string' },
                        },
                      },
                    },
                    ShippingDetails: {
                      type: 'object',
                      properties: {
                        ShippingMethod: { type: 'string' },
                        EstimatedDeliveryDate: { type: 'string', format: 'date-time' },
                        TrackingNumber: { type: 'string', nullable: true },
                        ShippingStatus: {
                          type: 'string',
                          enum: ['Pending', 'Shipped', 'Delivered', 'Canceled'],
                        },
                      },
                    },
                    PaymentDetails: {
                      type: 'object',
                      properties: {
                        PaymentStatus: {
                          type: 'string',
                          enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
                        },
                        PaymentMethodDetails: {
                          type: 'object',
                          oneOf: [
                            {
                              type: 'object',
                              properties: {
                                BoletoNumber: { type: 'string' },
                              },
                            },
                            {
                              type: 'object',
                              properties: {
                                CardType: { type: 'string' },
                                Last4Digits: { type: 'string' },
                                TransactionId: { type: 'string' },
                              },
                            },
                            {
                              type: 'object',
                              properties: {
                                PixTransactionId: { type: 'string' },
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Order successfully created',
            },
            400: {
              description: 'Invalid input',
            },
          },
        },
      },
    },
  },
  apis: [],
};
