import { getHashtagsFromString } from 'app/inventory/note-hashtags';
import { Loadout } from 'app/loadout/loadout-types';

// Mock the dependencies
jest.mock('app/inventory/note-hashtags');
jest.mock('app/manifest/selectors');
jest.mock('app/loadout-analyzer/hooks');

const mockGetHashtagsFromString = getHashtagsFromString as jest.MockedFunction<
  typeof getHashtagsFromString
>;

describe('useLoadoutFilterPills hashtag handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should merge hashtags with different cases', () => {
    // Mock loadouts with hashtags of different cases
    const loadouts: Partial<Loadout>[] = [
      { id: '1', name: 'Loadout #PVP' },
      { id: '2', name: 'Another #pvp loadout' },
      { id: '3', name: 'Third #PvP setup' },
    ];

    // Mock the hashtag extraction
    mockGetHashtagsFromString
      .mockReturnValueOnce(['#PVP'])
      .mockReturnValueOnce(['#pvp'])
      .mockReturnValueOnce(['#PvP']);

    // Test the hashtag normalization logic
    const loadoutsByHashtag: { [hashtag: string]: Partial<Loadout>[] } = {};

    for (const loadout of loadouts) {
      const hashtags = getHashtagsFromString(loadout.name!, '');
      for (const hashtag of hashtags) {
        const normalizedHashtag = hashtag.replace('#', '').replace(/_/g, ' ').toLowerCase();
        (loadoutsByHashtag[normalizedHashtag] ??= []).push(loadout);
      }
    }

    // All three loadouts should be grouped under the same normalized hashtag
    expect(loadoutsByHashtag['pvp']).toHaveLength(3);
    expect(loadoutsByHashtag['pvp']).toContain(loadouts[0]);
    expect(loadoutsByHashtag['pvp']).toContain(loadouts[1]);
    expect(loadoutsByHashtag['pvp']).toContain(loadouts[2]);

    // Should not have separate entries for different cases
    expect(loadoutsByHashtag['PVP']).toBeUndefined();
    expect(loadoutsByHashtag['PvP']).toBeUndefined();
  });

  test('should handle hashtags with underscores and different cases', () => {
    const loadouts: Partial<Loadout>[] = [
      { id: '1', name: 'Loadout #Master_Work' },
      { id: '2', name: 'Another #master_work loadout' },
      { id: '3', name: 'Third #MASTER_WORK setup' },
    ];

    mockGetHashtagsFromString
      .mockReturnValueOnce(['#Master_Work'])
      .mockReturnValueOnce(['#master_work'])
      .mockReturnValueOnce(['#MASTER_WORK']);

    const loadoutsByHashtag: { [hashtag: string]: Partial<Loadout>[] } = {};

    for (const loadout of loadouts) {
      const hashtags = getHashtagsFromString(loadout.name!, '');
      for (const hashtag of hashtags) {
        const normalizedHashtag = hashtag.replace('#', '').replace(/_/g, ' ').toLowerCase();
        (loadoutsByHashtag[normalizedHashtag] ??= []).push(loadout);
      }
    }

    // All should be grouped under 'master work'
    expect(loadoutsByHashtag['master work']).toHaveLength(3);
    expect(loadoutsByHashtag['Master Work']).toBeUndefined();
    expect(loadoutsByHashtag['MASTER WORK']).toBeUndefined();
  });

  test('should sort options case-insensitively', () => {
    const options = [
      { key: 'ZZZ', value: null, content: null },
      { key: 'aaa', value: null, content: null },
      { key: 'BBB', value: null, content: null },
      { key: 'ccc', value: null, content: null },
    ];

    // Test case-insensitive sorting
    const sorted = options.sort((a, b) => a.key.toLowerCase().localeCompare(b.key.toLowerCase()));

    expect(sorted.map((o) => o.key)).toEqual(['aaa', 'BBB', 'ccc', 'ZZZ']);
  });
});
