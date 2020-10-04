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

const errors = {
  DestinyNoRoomInDestination: {
    Response: 0,
    ErrorCode: 1642,
    ThrottleSeconds: 0,
    ErrorStatus: 'DestinyNoRoomInDestination',
    Message: 'There are no item slots available to transfer this item.',
    MessageData: {},
  },
  SystemDisabled: {
    Response: 0,
    ErrorCode: 5,
    ThrottleSeconds: 0,
    ErrorStatus: 'SystemDisabled',
    Message: 'This system is temporarily disabled for maintenance.',
    MessageData: {},
  },
};

// shimming in the global polyfill because i am a criminal
require('cross-fetch/polyfill');

type TroubleshootingResponse = { req: Request; ErrorCode: number };

const makePretendFetch = (response?: any) => (req: any) => ({
  json: () => ({ req: req as Request, ErrorCode: 1, ...response }),
});
const pretendHttpClient = (response?: any) =>
  createHttpClient((makePretendFetch(response) as any) as typeof fetch, '123', false);

// bungieApiQuery(`/Platform/GlobalAlerts/`)

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

test.each(cases)('check Request build for %s', async (apiFunc, apiFuncParams) => {
  const request: TroubleshootingResponse = await apiFunc(pretendHttpClient(), apiFuncParams);
  const { headers, method, url, body } = request.req;
  expect({ headers, method, url, body }).toMatchSnapshot();
});

test('should throw an error if called without an arg', async () => {
  expect(async () => {
    (await pullFromPostmaster(pretendHttpClient(errors.DestinyNoRoomInDestination), {
      characterId: '1234658790',
      membershipType: 3,
      itemId: '0987654321',
      itemReferenceHash: 45674576,
      stackSize: 7,
    })) as any;
  }).toThrow('You must provide a number');
});

// test('should throw an error if called without a number', () => {
//   expect(() => {
//     calculateSquare('45'));
//   }.toThrow('You must provide a number');
// }
