export type AllOfferShippingDetails = {
    ShippingMethod: string;
    EstimatedDeliveryDate: string;
    TrackingNumber: string | null;
    ShippingStatus: 'Pending' | 'Shipped' | 'Delivered' | 'Canceled';
  };
