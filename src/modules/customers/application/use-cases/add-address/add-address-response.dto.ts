export interface AddAddressResponseDto {
  id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  reference?: string;
}
