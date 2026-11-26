// SAMPLE mock distances from the shop (Banjara Hills, 500034) — approximate road km.
// TODO (maps): replace with a real distance lookup (e.g. Google Maps Distance Matrix)
// from the customer's address, called server-side.
import type { PincodeInfo } from '../types';

export const PINCODES: PincodeInfo[] = [
  { pincode: '500034', area: 'Banjara Hills', distanceKm: 1.5 },
  { pincode: '500033', area: 'Jubilee Hills', distanceKm: 2.8 },
  { pincode: '500082', area: 'Somajiguda', distanceKm: 3.9 },
  { pincode: '500028', area: 'Mehdipatnam', distanceKm: 5.2 },
  { pincode: '500016', area: 'Begumpet', distanceKm: 6.4 },
  { pincode: '500081', area: 'Madhapur / HITEC City', distanceKm: 7.6 },
  { pincode: '500003', area: 'Secunderabad', distanceKm: 10.2 },
  { pincode: '500032', area: 'Gachibowli', distanceKm: 12.1 },
  { pincode: '500072', area: 'Kukatpally', distanceKm: 13.8 },
  { pincode: '500074', area: 'LB Nagar', distanceKm: 17.5 },
];
