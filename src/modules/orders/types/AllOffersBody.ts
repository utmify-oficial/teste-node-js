import { AllOffersItem } from './AllOffersItem';
import { AllOffersShippingDetails } from './AllOffersShippingDetails';
import { AllOffersCustomer } from './AllOffersCustomer';

export type AllOffersBody = {
    WebhookId: string;
    OrderId: string;
    PaymentMethod: string;
    UserCommission: number;
    TotalSaleAmount: number;
    PlatformCommission: number;
    Currency: string;
    SaleStatus: string;
    Customer: AllOffersCustomer;
    OrderCreatedDate: string;
    PaymentDate: string | null;
    RefundDate: string | null;
    Items: AllOffersItem[];
    ShippingDetails: AllOffersShippingDetails;
  };