import { jest } from '@jest/globals';
import { DestinyProfileResponse, PlatformErrorCodes, ServerResponse } from 'bungie-api-ts/destiny2';

type Destiny2Api = typeof import('app/bungie-api/destiny2-api');

/** The mocked Bungie.net APIs, captured from the mocked module. */
export interface Destiny2ApiMocks {
  transferMock: jest.MockedFunction<Destiny2Api['transfer']>;
  equipMock: jest.MockedFunction<Destiny2Api['equip']>;
  equipItemsMock: jest.MockedFunction<Destiny2Api['equipItems']>;
  setLockStateMock: jest.MockedFunction<Destiny2Api['setLockState']>;
  setTrackedStateMock: jest.MockedFunction<Destiny2Api['setTrackedState']>;
  getCharactersMock: jest.MockedFunction<Destiny2Api['getCharacters']>;
  /** Clear call history and restore the default "success" implementations. Call from beforeEach. */
  resetMocks: () => void;
}

/** A successful Bungie.net write response - the move logic just awaits these, it ignores the body. */
const successResponse: ServerResponse<number> = {
  Response: 0,
  ErrorCode: PlatformErrorCodes.Success,
  ThrottleSeconds: 0,
  ErrorStatus: 'Success',
  Message: '',
  MessageData: {},
};

/** A minimal character refresh response - only the fields the post-loadout-apply refresh reads. */
const getCharactersResponse = {
  characters: { data: {} },
} as unknown as DestinyProfileResponse;

/**
 * Mock the Bungie.net write APIs (and the post-loadout-apply character
 * refresh) so tests exercising item moves don't hit the network. Each mock
 * just reports success - the in-memory store model is updated by the reducer,
 * not by these responses, so resolving is enough to drive the move logic.
 *
 * Native ESM: this uses unstable_mockModule, so it must be called (and
 * awaited) before importing anything that transitively imports
 * 'app/bungie-api/destiny2-api' (e.g. testing/move-item-test-utils or the
 * modules under test) - see item-move-service.test.ts.
 */
export async function mockDestiny2Api(): Promise<Destiny2ApiMocks> {
  jest.unstable_mockModule('app/bungie-api/destiny2-api', () => {
    // Spread the real module so every export is present for ESM link-time
    // binding; only the APIs the tests exercise are mocked.
    const actual = jest.requireActual<Destiny2Api>('app/bungie-api/destiny2-api');
    return {
      ...actual,
      transfer: jest.fn(() => Promise.resolve(successResponse)),
      equip: jest.fn(() => Promise.resolve(successResponse)),
      equipItems: jest.fn(() => Promise.resolve({})),
      setLockState: jest.fn(() => Promise.resolve(successResponse)),
      setTrackedState: jest.fn(() => Promise.resolve(successResponse)),
      getCharacters: jest.fn(() => Promise.resolve(getCharactersResponse)),
    };
  });

  const destiny2Api = await import('app/bungie-api/destiny2-api');
  const transferMock = destiny2Api.transfer as jest.MockedFunction<Destiny2Api['transfer']>;
  const equipMock = destiny2Api.equip as jest.MockedFunction<Destiny2Api['equip']>;
  const equipItemsMock = destiny2Api.equipItems as jest.MockedFunction<Destiny2Api['equipItems']>;
  const setLockStateMock = destiny2Api.setLockState as jest.MockedFunction<
    Destiny2Api['setLockState']
  >;
  const setTrackedStateMock = destiny2Api.setTrackedState as jest.MockedFunction<
    Destiny2Api['setTrackedState']
  >;
  const getCharactersMock = destiny2Api.getCharacters as jest.MockedFunction<
    Destiny2Api['getCharacters']
  >;

  return {
    transferMock,
    equipMock,
    equipItemsMock,
    setLockStateMock,
    setTrackedStateMock,
    getCharactersMock,
    resetMocks: () => {
      transferMock.mockReset();
      transferMock.mockResolvedValue(successResponse);
      equipMock.mockReset();
      equipMock.mockResolvedValue(successResponse);
      equipItemsMock.mockReset();
      equipItemsMock.mockResolvedValue({});
      setLockStateMock.mockReset();
      setLockStateMock.mockResolvedValue(successResponse);
      setTrackedStateMock.mockReset();
      setTrackedStateMock.mockResolvedValue(successResponse);
      getCharactersMock.mockReset();
      getCharactersMock.mockResolvedValue(getCharactersResponse);
    },
  };
}
