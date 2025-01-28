// Tipos de método de pagamento
export type AllOffersPaymentMethod = 'Pix' | 'Boleto' | 'CreditCard';

// Tipos de status de pagamento
export type AllOffersPaymentDetailsPaymentStatus = 'Paid' | 'Refunded' | 'AwaitingPayment';

// Tipos de detalhes de pagamento específicos
export interface PixPaymentMethod {
  PixTransactionId: string;
}

export interface CardPaymentMethod {
  CardType: string;
  Last4Digits: string;
  TransactionId: string;
}

export interface BoletoPaymentMethod {
  BoletoNumber: string;
}

// Interfaces de endereço
export interface AllOffersAddress {
  Street: string;
  City: string;
  State: string;
  ZipCode: string;
  Country: string;
}

// Extendendo a interface base de endereço
export type AllOffersCustomerBillingAddress = AllOffersAddress;
export type AllOffersCustomerShippingAddress = AllOffersAddress;

// Interfaces de detalhes
export interface AllOffersItems {
  ItemId: string;
  ItemName: string;
  Quantity: number;
  UnitPrice: number;
  ItemCategory: string;
  ItemBrand: string;
  ItemSku: string;
}

export interface AllOffersShippingDetails {
  ShippingMethod: string;
  EstimatedDeliveryDate: string;
  TrackingNumber: string | null;
  ShippingStatus: string;
}

export interface AllOffersPaymentDetails {
  PaymentStatus: AllOffersPaymentDetailsPaymentStatus;
  PaymentMethodDetails: PixPaymentMethod | CardPaymentMethod | BoletoPaymentMethod;
}

export interface AllOffersCustomer {
  FirstName: string;
  LastName: string;
  Phone: string;
  Email: string;
  Country: string;
  BillingAddress: AllOffersCustomerBillingAddress;
  ShippingAddress: AllOffersCustomerShippingAddress;
}

export interface AllOffersOrderDetails {
  Items: AllOffersItems[];
  TotalSaleAmount: number;
  PlatformCommission: number;
  UserCommission: number;
}

// Interface principal do payload
export interface AllOffersBody {
  WebhookId: string;
  OrderId: string;
  PaymentMethod: AllOffersPaymentMethod;
  UserCommission: number;
  TotalSaleAmount: number;
  PlatformCommission: number;
  Currency: string;
  SaleStatus: AllOffersPaymentDetailsPaymentStatus;
  Customer: AllOffersCustomer;
  OrderCreatedDate: string;
  PaymentDate: string | null;
  RefundDate: string | null;
  PaymentGateway: AllOffersPaymentMethod;
  OrderNotes: string;
  CouponCode: string;
  Items: AllOffersItems[];
  ShippingDetails: AllOffersShippingDetails;
  PaymentDetails: AllOffersPaymentDetails;
}
