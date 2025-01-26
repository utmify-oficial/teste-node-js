export type WorldMarketCustomer = {
  customer_id: string;
  name: string;
  email: string;
  phone: string;
  address: WorldMarketCustomerAddress;
};

type WorldMarketCustomerAddress = {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
};
