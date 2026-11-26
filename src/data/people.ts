// SAMPLE delivery staff. Names and numbers are placeholders.
// TODO (database/login): load staff from the API; each delivery person logs in
// with phone OTP and only ever receives their own assignments.
import type { DeliveryPerson } from '../types';

export const DELIVERY_PEOPLE: DeliveryPerson[] = [
  { id: 'dp-ravi', name: 'Ravi Kumar', phone: '+91 90000 20001' },
  { id: 'dp-imran', name: 'Imran Shaikh', phone: '+91 90000 20002' },
];
