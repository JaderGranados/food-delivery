export interface AddAddressCommand {
  customerId: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  reference?: string;
}
