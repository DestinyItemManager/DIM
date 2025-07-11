import { DimItem } from 'app/inventory/item-types';
import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import { formatWeaponRollForExport } from './weapon-roll-export';

// Mock socket utils
jest.mock('app/utils/socket-utils', () => ({
  getWeaponArchetypeSocket: jest.fn(),
  getSocketsWithStyle: jest.fn(),
  isWeaponMasterworkSocket: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const { getWeaponArchetypeSocket, getSocketsWithStyle, isWeaponMasterworkSocket } =
  jest.requireMock('app/utils/socket-utils');

describe('formatWeaponRollForExport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty string for non-weapon items', () => {
    const item = {
      bucket: { inWeapons: false },
      sockets: {},
    } as DimItem;

    const result = formatWeaponRollForExport(item);
    expect(result).toBe('');
  });

  it('should return empty string for items without sockets', () => {
    const item = {
      bucket: { inWeapons: true },
      sockets: null,
    } as DimItem;

    const result = formatWeaponRollForExport(item);
    expect(result).toBe('');
  });

  it('should format a basic weapon roll correctly', () => {
    const item = {
      name: 'Test Weapon',
      bucket: { inWeapons: true },
      sockets: {
        allSockets: [
          {
            plugged: {
              plugDef: {
                displayProperties: { name: 'Masterwork Stat' },
              },
            },
          },
        ],
      },
    } as DimItem;

    // Mock the socket utilities
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    getWeaponArchetypeSocket.mockReturnValue({
      plugged: {
        plugDef: {
          displayProperties: { name: 'Aggressive Frame' },
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    getSocketsWithStyle.mockImplementation((_sockets: any, style: any) => {
      if (style === DestinySocketCategoryStyle.LargePerk) {
        return [
          {
            plugged: {
              plugDef: {
                displayProperties: { name: 'Arrowhead Brake' },
              },
            },
          },
        ];
      }
      if (style === DestinySocketCategoryStyle.Reusable) {
        return [
          {
            plugged: {
              plugDef: {
                displayProperties: { name: 'Outlaw' },
                itemCategoryHashes: [],
              },
            },
          },
          {
            plugged: {
              plugDef: {
                displayProperties: { name: 'Rampage' },
                itemCategoryHashes: [],
              },
            },
          },
        ];
      }
      return [];
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    isWeaponMasterworkSocket.mockImplementation(
      (socket: any) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        socket.plugged?.plugDef.displayProperties.name === 'Masterwork Stat',
    );

    const result = formatWeaponRollForExport(item);

    expect(result).toMatchSnapshot();
    expect(result).toContain('[Test Weapon]');
    expect(result).toContain('* Aggressive Frame');
    expect(result).toContain('* Arrowhead Brake');
    expect(result).toContain('* Outlaw');
    expect(result).toContain('* Rampage');
    expect(result).toContain('* Masterwork Stat');
  });
});
