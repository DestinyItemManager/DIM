import {
  DestinyComponentType,
  getItem,
  getLinkedProfiles,
  getProfile,
  getVendor,
  pullFromPostmaster,
} from 'bungie-api-ts/destiny2';
// import { bungieApiQuery } from './bungie-api-utils';
import { createHttpClient } from './http-client';

// shimming in the global polyfill because i am a criminal
require('cross-fetch/polyfill');

type TroubleshootingResponse = { req: Request; ErrorCode: number };

const pretendFetch = (req: any) => ({
  json: () => ({ req: req as Request, ErrorCode: 1 }),
});
const pretendHttpClient = createHttpClient((pretendFetch as any) as typeof fetch, '123', false);

// bungieApiQuery(`/Platform/GlobalAlerts/`)

describe('test http request formation', () => {
  const cases: [(...params: any) => any, object | undefined][] = [
    [
      getLinkedProfiles,
      {
        membershipId: '123456',
        membershipType: 3,
        getAllMemberships: true,
      },
    ],
    [
      getProfile,
      {
        destinyMembershipId: '123456',
        membershipType: 3,
        components: [1, 2, 3],
      },
    ],
    [
      getItem,
      {
        destinyMembershipId: '123456',
        membershipType: 3,
        itemInstanceId: '0987654321',
        components: [7],
      },
    ],
    [
      getVendor,
      {
        characterId: '1234658790',
        destinyMembershipId: '123456',
        membershipType: 3,
        components: [
          DestinyComponentType.Vendors,
          DestinyComponentType.VendorSales,
          DestinyComponentType.ItemInstances,
          DestinyComponentType.ItemObjectives,
          DestinyComponentType.ItemStats,
          DestinyComponentType.ItemSockets,
          DestinyComponentType.ItemTalentGrids,
          DestinyComponentType.ItemCommonData,
          DestinyComponentType.CurrencyLookups,
          DestinyComponentType.ItemPlugStates,
          DestinyComponentType.ItemReusablePlugs,
          // TODO: We should try to defer this until the popup is open!
          DestinyComponentType.ItemPlugObjectives,
        ],
        vendorHash: 45674576,
      },
    ],
    [
      pullFromPostmaster,
      {
        characterId: '1234658790',
        membershipType: 3,
        itemId: '0987654321',
        itemReferenceHash: 45674576,
        stackSize: 7,
        transferToVault: true,
      },
    ],
  ];

  test.each(cases)('check generic bungieApiQuery function', async (apiFunc, apiFuncParams) => {
    const request: TroubleshootingResponse = await apiFunc(pretendHttpClient, apiFuncParams);
    const { headers, method, url, body } = request.req;
    expect({ headers, method, url, body }).toMatchSnapshot();
  });
});
