// Specifying the types for these modules skips huge type inference from JSON
// steps. Sadly these can't use a wildcard because TypeScript will not match
// wildcards across `-` characters.

declare module 'testing/data/profile-2025-12-02.json' {
  import { DestinyProfileResponse, ServerResponse } from 'bungie-api-ts/destiny2';
  const value: ServerResponse<DestinyProfileResponse>;
  export default value;
}

declare module 'testing/data/vendors-2025-12-02.json' {
  import { DestinyVendorsResponse, ServerResponse } from 'bungie-api-ts/destiny2';
  const value: ServerResponse<DestinyVendorsResponse>;
  export default value;
}

declare module 'testing/data/d1profiles-2022-10-24.json' {
  import { D1GetAccountResponse } from 'app/destiny1/d1-manifest-types';
  const value: D1GetAccountResponse;
  export default value;
}
