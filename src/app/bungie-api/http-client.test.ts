import {
  DestinyComponentType,
  getItem,
  getLinkedProfiles,
  getProfile,
  getVendor,
  pullFromPostmaster,
} from 'bungie-api-ts/destiny2';
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

interface TroubleshootingResponse {
  req: Request;
  ErrorCode: number;
}

const makePretendFetch = (response?: any) => (req: any) => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  json: () => ({ req: req as Request, ErrorCode: 1, ...response }),
});
const pretendHttpClient = (response?: any) =>
  createHttpClient(makePretendFetch(response) as any as typeof fetch, '123');

const cases: [(...params: any) => any, object | undefined][] = [
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
    getProfile,
    {
      destinyMembershipId: '123456',
      membershipType: 3,
      components: [1, 2, 3],
    },
  ],
  [
    getLinkedProfiles,
    {
      membershipId: '123456',
      membershipType: 3,
      getAllMemberships: true,
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

test.each(cases)('check Request builder for %p', async (apiFunc, apiFuncParams) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const request: TroubleshootingResponse = await apiFunc(pretendHttpClient(), apiFuncParams);
  const { headers, method, url, body } = request.req;
  expect({ headers, method, url, body }).toMatchSnapshot();
});

test('should throw an error if there is no room in the destination', async () => {
  expect.assertions(1);
  await expect(async () => {
    (await pullFromPostmaster(pretendHttpClient(errors.DestinyNoRoomInDestination), {
      characterId: '1234658790',
      membershipType: 3,
      itemId: '0987654321',
      itemReferenceHash: 45674576,
      stackSize: 7,
    })) as any;
  }).rejects.toMatchInlineSnapshot(
    `[BungieError: There are no item slots available to transfer this item.]`,
  );
});

test('should throw an error if API is down for maintenance', async () => {
  expect.assertions(1);
  await expect(async () => {
    (await pullFromPostmaster(pretendHttpClient(errors.SystemDisabled), {
      characterId: '1234658790',
      membershipType: 3,
      itemId: '0987654321',
      itemReferenceHash: 45674576,
      stackSize: 7,
    })) as any;
  }).rejects.toMatchInlineSnapshot(
    `[BungieError: This system is temporarily disabled for maintenance.]`,
  );
});
