// services/AllOffersTransformationService.ts
import { UtmifyPaymentMethod } from '../types/UtmifyPaymentMethod';
import { UtmifyTransactionStatus } from '../types/UtmifyTransactionStatus';
import { UtmifyProduct } from '../types/UtmifyProduct';
import { UtmifyCustomer } from '../types/UtmifyCustomer';
import { UtmifyValues } from '../types/UtmifyValues';
import { RequestError } from '../../../core/errors/RequestError';
import {
  AllOffersPaymentMethod,
  AllOffersItems,
  AllOffersCustomer,
  AllOffersOrderDetails,
  AllOffersPaymentDetailsPaymentStatus,
} from '../types/AllOffers';
export class AllOffersTransformationService {
  transformPaymentMethod(method: AllOffersPaymentMethod): UtmifyPaymentMethod {
    switch (method) {
      case 'Pix': return UtmifyPaymentMethod.Pix;
      case 'Boleto': return UtmifyPaymentMethod.Billet;
      case 'CreditCard': return UtmifyPaymentMethod.CreditCard;
      default: throw new RequestError(400, `Unknown payment method: ${method}`);
    }
  }

  transformTransactionStatus(status: AllOffersPaymentDetailsPaymentStatus): UtmifyTransactionStatus {
    switch (status) {
      case 'Paid': return UtmifyTransactionStatus.Paid;
      case 'AwaitingPayment': return UtmifyTransactionStatus.Pending;
      case 'Refunded': return UtmifyTransactionStatus.Refunded;
      default: throw new RequestError(400, `Unknown transaction status: ${status}`);
    }
  }

  transformProducts(products: AllOffersItems[]): UtmifyProduct[] {
    return products.map(({ ItemId, ItemName, Quantity, UnitPrice }) => ({
      id: ItemId,
      name: ItemName,
      priceInCents: UnitPrice * 100,
      quantity: Quantity,
    }));
  }

  transformCustomer(customer: AllOffersCustomer): UtmifyCustomer {
    return {
      id: crypto.randomUUID(),
      fullName: `${customer.FirstName} ${customer.LastName}`,
      email: customer.Email,
      phone: customer.Phone,
      country: customer.Country,
    };
  }

  transformValues(orderDetails: AllOffersOrderDetails): UtmifyValues {
    return {
      totalValueInCents: (orderDetails.TotalSaleAmount ?? 0) * 100,
      sellerValueInCents: (orderDetails.UserCommission ?? 0) * 100,
      shippingValueInCents: 0,
      platformValueInCents: (orderDetails.PlatformCommission ?? 0) * 100,
    };
  }
}
