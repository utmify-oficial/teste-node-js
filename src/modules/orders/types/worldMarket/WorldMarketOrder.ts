import { WorldMarketCustomer } from './WorldMarketCustomer';
import { WorldMarketPaymentDetails } from './WorldMarketPaymentMethod';
import { WorldMarketProduct } from './WorldMarketProduct';
import { WorldMarketShippingDetails } from './WorldMarketShipping';
import { WorldMarketStatus } from './WorldMarketTransactionStatus';

export type WorldMarketOrder = {
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

export type WorldMarketOrderDetails = {
  products: WorldMarketProduct[];
  total: number;
  shipping_fee: number;
  platform_fee: number;
  seller_fee: number;
};
