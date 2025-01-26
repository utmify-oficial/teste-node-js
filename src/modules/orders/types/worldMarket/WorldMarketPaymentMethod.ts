import { WorldMarketStatus } from './WorldMarketTransactionStatus';

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
