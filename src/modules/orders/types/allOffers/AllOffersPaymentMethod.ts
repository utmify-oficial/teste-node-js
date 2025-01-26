export type AllOfferPaymentMethod = 'Boleto' | 'CreditCard' | 'Pix';

export type AllOffersCurrency = 'EUR' | 'USD' | 'BRL';

export type AllOfferPaymentDetails = {
    PaymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
    PaymentMethodDetails: BilletPaymentMethodDetails | CardPaymentMethodDetails | PixPaymentMethodDetails;
  };

type BilletPaymentMethodDetails = {
    BoletoNumber: string;
  };

type CardPaymentMethodDetails = {
    CardType: string;
    Last4Digits: string;
    TransactionId: string;
  };
type PixPaymentMethodDetails = {
    PixTransactionId: string;
}
