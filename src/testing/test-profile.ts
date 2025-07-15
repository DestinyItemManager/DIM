import {
  DestinyProfileResponse,
  DestinyVendorsResponse,
  ServerResponse,
} from 'bungie-api-ts/destiny2';
import profile from './data/profile-2024-06-13.json';
import vendors from './data/vendors-2024-06-13.json';

export const getTestProfile = () =>
  (profile as unknown as ServerResponse<DestinyProfileResponse>).Response;
export const getTestVendors = () =>
  (vendors as unknown as ServerResponse<DestinyVendorsResponse>).Response;
