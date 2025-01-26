export type AllOffersCustomer = {
    FirstName: string;
    LastName: string;
    Phone: string;
    Email: string;
    Country: string;
    BillingAddress: AllOffersCustomerAddress;
    ShippingAddress: AllOffersCustomerAddress;
  };

type AllOffersCustomerAddress = {
    Street: string;
    City: string;
    State: string;
    ZipCode: string;
    Country: string;
  };
