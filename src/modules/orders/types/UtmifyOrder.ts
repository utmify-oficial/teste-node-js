import { UtmifyCustomer } from './UtmifyCustomer';
import { UtmifyIntegrationPlatform } from './UtmifyIntegrationPlatform';
import { UtmifyPaymentMethod } from './UtmifyPaymentMethod';
import { UtmifyProduct } from './UtmifyProduct';
import { UtmifyTransactionStatus } from './UtmifyTransactionStatus';
import { UtmifyValues } from './UtmifyValues';

export type UtmifyOrder = {
  saleId: string;
  externalWebhookId: string;
  platform: UtmifyIntegrationPlatform;
  paymentMethod: UtmifyPaymentMethod;
  transactionStatus: UtmifyTransactionStatus | Promise<UtmifyTransactionStatus>;
  products: UtmifyProduct[];
  customer: UtmifyCustomer;
  values: UtmifyValues | Promise<UtmifyValues>;
  createdAt: Date;
  updatedAt: Date;
  paidAt: Date | null;
  refundedAt: Date | null;
};
