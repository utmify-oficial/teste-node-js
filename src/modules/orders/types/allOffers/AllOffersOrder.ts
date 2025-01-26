import { AllOffersCustomer } from './AllOffersCustomer';
import { AllOfferPaymentDetails, AllOfferPaymentMethod, AllOffersCurrency } from './AllOffersPaymentMethod';
import { AllOffersOrderItem } from './AllOffersProduct';
import { AllOfferShippingDetails } from './AllOffersShipping';
import { AllOffersSaleStatus } from './AllOffersTransactionStatus';

export type AllOffersOrder = {
    WebhookId: string;
    OrderId: string;
    PaymentMethod: AllOfferPaymentMethod;
    UserCommission: number;
    TotalSaleAmount: number;
    PlatformCommission: number;
    Currency: AllOffersCurrency;
    SaleStatus: AllOffersSaleStatus;
    Customer: AllOffersCustomer;
    OrderCreatedDate: string;
    PaymentDate: string | null;
    RefundDate: string | null;
    PaymentGateway: string;
    OrderNotes: string;
    CouponCode: string | null;
    Items: AllOffersOrderItem[];
    ShippingDetails: AllOfferShippingDetails;
    PaymentDetails: AllOfferPaymentDetails;
  };
