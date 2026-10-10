import { randomUUID } from 'crypto';
import {
  AddressFieldRequiredError,
  AddressFieldTooLongError,
  InvalidPostalCodeError,
} from '../errors.js';

const MAX_TEXT_LENGTH = 200;
const POSTAL_CODE_PATTERN = /^[A-Za-z0-9\- ]{3,10}$/;

export interface AddressProps {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  reference?: string;
}

export class Address {
  private constructor(
    readonly id: string,
    readonly street: string,
    readonly city: string,
    readonly state: string,
    readonly postalCode: string,
    readonly country: string,
    readonly reference?: string,
  ) {}

  static create(props: AddressProps): Address {
    const street = props.street?.trim();
    const city = props.city?.trim();
    const state = props.state?.trim();
    const postalCode = props.postalCode?.trim();
    const country = props.country?.trim();
    const reference = props.reference?.trim() || undefined;

    if (!street) throw new AddressFieldRequiredError('street');
    if (street.length > MAX_TEXT_LENGTH) {
      throw new AddressFieldTooLongError('street', MAX_TEXT_LENGTH);
    }
    if (!city) throw new AddressFieldRequiredError('city');
    if (!state) throw new AddressFieldRequiredError('state');
    if (!postalCode) throw new AddressFieldRequiredError('postalCode');
    if (!POSTAL_CODE_PATTERN.test(postalCode)) {
      throw new InvalidPostalCodeError(postalCode);
    }
    if (!country) throw new AddressFieldRequiredError('country');
    if (reference && reference.length > MAX_TEXT_LENGTH) {
      throw new AddressFieldTooLongError('reference', MAX_TEXT_LENGTH);
    }

    return new Address(
      randomUUID(),
      street,
      city,
      state,
      postalCode,
      country,
      reference,
    );
  }

  equals(other: Address): boolean {
    return (
      this.street === other.street &&
      this.city === other.city &&
      this.state === other.state &&
      this.postalCode === other.postalCode &&
      this.country === other.country &&
      this.reference === other.reference
    );
  }
}
