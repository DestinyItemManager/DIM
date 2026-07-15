import { beforeAll, jest } from '@jest/globals';
import {
  BungieMembershipType,
  DestinyLinkedProfilesResponse,
  PlatformErrorCodes,
} from 'bungie-api-ts/destiny2';
import d1Profile from 'testing/data/d1profiles-2022-10-24.json';
import linkedAccounts from 'testing/data/linkedaccounts-2025-07-15.json';

// Native ESM: use unstable_mockModule + dynamic import for mocking ES modules
let generatePlatforms: typeof import('./destiny-account').generatePlatforms;
let Tokens: typeof import('app/bungie-api/oauth-tokens').Tokens;

beforeAll(async () => {
  await jest.unstable_mockModule('app/bungie-api/oauth-tokens', () => ({
    getToken: (): unknown =>
      ({
        accessToken: { value: 'foo' },
      }) as unknown,
    setToken: () => {},
    removeToken: () => {},
    hasValidAuthTokens: () => true,
    removeAccessToken: () => {},
    hasTokenExpired: () => false,
  }));

  const oauth = await import('app/bungie-api/oauth-tokens');
  Tokens = oauth.Tokens;
  const dc = await import('./destiny-account');
  generatePlatforms = dc.generatePlatforms;
});

// This relies on knowing what the accounts that go with the linkedaccounts data are
beforeEach(() => {
  // One D1 account exists
  fetchMock.mockIf(
    'https://www.bungie.net/D1/Platform/Destiny/2/Account/4611686018433092312/',
    JSON.stringify(d1Profile),
  );
  // One doesn't
  fetchMock.mockIf(
    'https://www.bungie.net/D1/Platform/Destiny/1/Account/4611686018429726245/',
    '{"ErrorCode":1601,"ThrottleSeconds":0,"ErrorStatus":"DestinyAccountNotFound","Message":"We were unable to find your Destiny account information.  If you have a valid Destiny Account, let us know.","MessageData":{}}',
  );
});

describe('generatePlatforms', () => {
  it('gets one D2 account and one D1 account', async () => {
    const platforms = await generatePlatforms(
      linkedAccounts as unknown as DestinyLinkedProfilesResponse,
    );

    expect(platforms.length).toBe(2);

    const d2account = platforms.find((platform) => platform.destinyVersion === 2)!;
    const d1account = platforms.find((platform) => platform.destinyVersion === 1)!;
    expect(d2account).not.toBeUndefined();
    expect(d1account).not.toBeUndefined();

    expect(d2account.displayName).toBe('VidBoi#9226');
    expect(d1account.displayName).toBe('VidBoi#9226');

    expect(d2account.originalPlatformType).toBe(BungieMembershipType.TigerPsn);
    expect(d1account.originalPlatformType).toBe(BungieMembershipType.TigerPsn);

    expect(d2account.platforms.length).toBeGreaterThan(1);

    expect(d2account.lastPlayed.getTime()).toBeGreaterThan(d1account.lastPlayed.getTime());
    expect(d2account.lastPlayed).not.toBe(0);
    expect(d1account.lastPlayed).not.toBe(0);
  });

  it('handles when D2 accounts are in profilesWithErrors and error code DestinyUnexpectedError', async () => {
    const originalAccounts = linkedAccounts as unknown as DestinyLinkedProfilesResponse;

    const errorAccounts: DestinyLinkedProfilesResponse = {
      ...originalAccounts,
      profiles: [],
      profilesWithErrors: [
        ...originalAccounts.profilesWithErrors,
        ...originalAccounts.profiles.map((p) => ({
          errorCode: PlatformErrorCodes.DestinyUnexpectedError,
          infoCard: p,
        })),
      ],
    };

    const platforms = await generatePlatforms(errorAccounts);

    expect(platforms.length).toBe(2);

    const d2account = platforms.find((platform) => platform.destinyVersion === 2)!;
    const d1account = platforms.find((platform) => platform.destinyVersion === 1)!;
    expect(d2account).not.toBeUndefined();
    expect(d1account).not.toBeUndefined();

    expect(d2account.displayName).toBe('VidBoi#9226');
    expect(d1account.displayName).toBe('VidBoi#9226');

    expect(d2account.originalPlatformType).toBe(BungieMembershipType.TigerPsn);
    expect(d1account.originalPlatformType).toBe(BungieMembershipType.TigerPsn);

    expect(d2account.platforms.length).toBeGreaterThan(1);

    // No use checking the dates, they'll be wrong
  });

  it('does not return D2 account when they are in profilesWithErrors and error code DestinyAccountNotFound', async () => {
    const originalAccounts = linkedAccounts as unknown as DestinyLinkedProfilesResponse;

    const errorAccounts: DestinyLinkedProfilesResponse = {
      ...originalAccounts,
      profiles: [],
      profilesWithErrors: [
        ...originalAccounts.profilesWithErrors,
        ...originalAccounts.profiles.map((p) => ({
          errorCode: PlatformErrorCodes.DestinyAccountNotFound,
          infoCard: p,
        })),
      ],
    };

    const platforms = await generatePlatforms(errorAccounts);

    expect(platforms.length).toBe(1);
    const d1account = platforms.find((platform) => platform.destinyVersion === 1)!;
    expect(d1account).not.toBeUndefined();
    expect(d1account.displayName).toBe('VidBoi#9226');
  });
});
