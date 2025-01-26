import mongooose, { Schema } from 'mongoose';
import { UtmifyIntegrationPlatform } from '../types/utimify/UtmifyIntegrationPlatform';
import { UtmifyPaymentMethod } from '../types/utimify/UtmifyPaymentMethod';
import { UtmifyTransactionStatus } from '../types/utimify/UtmifyTransactionStatus';
import { UtmifyOrderFromDb } from '../repositories/UtmifyOrdersRepository';

const ProductSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  priceInCents: { type: Number, required: true },
}, {
  _id: false,
});

const CustomerSchema = new Schema({
  id: { type: String, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  country: { type: String, required: true },
}, {
  _id: false,
});

const ValuesSchema = new Schema({
  totalValueInCents: { type: Number, required: true },
  sellerValueInCents: { type: Number, required: true },
  platformValueInCents: { type: Number, required: true },
  shippingValueInCents: { type: Number, required: false },
}, {
  _id: false,
});

export const UtmifyOrderSchema = new Schema({
  saleId: { type: String, required: true },
  externalWebhookId: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  platform: { type: String, required: true },
  transactionStatus: { type: String, required: true },
  products: { type: [ProductSchema], required: true },
  customer: { type: CustomerSchema, required: true },
  values: { type: ValuesSchema, required: true },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  paidAt: { type: Date, required: false },
  refundedAt: { type: Date, required: false },
}, {
  methods: {
    toEntity(): UtmifyOrderFromDb {
      return {
        _id: this._id,
        saleId: this.saleId,
        externalWebhookId: this.externalWebhookId,
        platform: this.platform as UtmifyIntegrationPlatform,
        paymentMethod: this.paymentMethod as UtmifyPaymentMethod,
        transactionStatus: this.transactionStatus as UtmifyTransactionStatus,
        products: this.products,
        customer: this.customer,
        values: {
          totalValueInCents: this.values.totalValueInCents,
          sellerValueInCents: this.values.sellerValueInCents,
          platformValueInCents: this.values.platformValueInCents,
          shippingValueInCents: this.values.shippingValueInCents ?? null,
        },
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        paidAt: this.paidAt ?? null,
        refundedAt: this.refundedAt ?? null,
      };
    },
  },
});

UtmifyOrderSchema.index({ saleId: 1, platform: 1, externalWebhookId: 1 }, { unique: true });
UtmifyOrderSchema.index({ createdAt: -1 });

export const UtmifyOrderModel = mongooose.model('orders', UtmifyOrderSchema);
