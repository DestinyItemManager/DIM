import { Loadout } from 'app/loadout/loadout-types';
import { computeLoadoutsByHashtag } from './hashtag-utils';

describe('computeLoadoutsByHashtag', () => {
  test('should merge hashtags with different cases', () => {
    // Test loadouts with hashtags of different cases
    const loadouts: Loadout[] = [
      { id: '1', name: 'Loadout #PVP', classType: 0, clearSpace: false, items: [] },
      { id: '2', name: 'Another #pvp loadout', classType: 0, clearSpace: false, items: [] },
      { id: '3', name: 'Third #PvP setup', classType: 0, clearSpace: false, items: [] },
    ];

    // Simple hashtag extraction function for testing
    const getHashtagsFromLoadout = (loadout: Loadout) => {
      const name = loadout.name;
      if (name.includes('#PVP')) {
        return ['#PVP'];
      }
      if (name.includes('#pvp')) {
        return ['#pvp'];
      }
      if (name.includes('#PvP')) {
        return ['#PvP'];
      }
      return [];
    };

    const result = computeLoadoutsByHashtag(loadouts, getHashtagsFromLoadout);

    // All three loadouts should be grouped under the same normalized hashtag
    expect(result.pvp).toHaveLength(3);
    expect(result.pvp).toContain(loadouts[0]);
    expect(result.pvp).toContain(loadouts[1]);
    expect(result.pvp).toContain(loadouts[2]);

    // Should not have separate entries for different cases
    expect(result.PVP).toBeUndefined();
    expect(result.PvP).toBeUndefined();
  });

  test('should handle hashtags with underscores and different cases', () => {
    const loadouts: Loadout[] = [
      { id: '1', name: 'Loadout #Master_Work', classType: 0, clearSpace: false, items: [] },
      { id: '2', name: 'Another #master_work loadout', classType: 0, clearSpace: false, items: [] },
      { id: '3', name: 'Third #MASTER_WORK setup', classType: 0, clearSpace: false, items: [] },
    ];

    const getHashtagsFromLoadout = (loadout: Loadout) => {
      const name = loadout.name;
      if (name.includes('#Master_Work')) {
        return ['#Master_Work'];
      }
      if (name.includes('#master_work')) {
        return ['#master_work'];
      }
      if (name.includes('#MASTER_WORK')) {
        return ['#MASTER_WORK'];
      }
      return [];
    };

    const result = computeLoadoutsByHashtag(loadouts, getHashtagsFromLoadout);

    // All should be grouped under 'master work'
    expect(result['master work']).toHaveLength(3);
    expect(result['Master Work']).toBeUndefined();
    expect(result['MASTER WORK']).toBeUndefined();
  });

  test('should handle multiple hashtags per loadout', () => {
    const loadouts: Loadout[] = [
      { id: '1', name: 'Loadout #PVP #trials', classType: 0, clearSpace: false, items: [] },
      { id: '2', name: 'Another #pvp #MW loadout', classType: 0, clearSpace: false, items: [] },
    ];

    const getHashtagsFromLoadout = (loadout: Loadout) => {
      const name = loadout.name;
      if (name.includes('#PVP #trials')) {
        return ['#PVP', '#trials'];
      }
      if (name.includes('#pvp #MW')) {
        return ['#pvp', '#MW'];
      }
      return [];
    };

    const result = computeLoadoutsByHashtag(loadouts, getHashtagsFromLoadout);

    // Both loadouts should be in the 'pvp' group
    expect(result.pvp).toHaveLength(2);
    expect(result.pvp).toContain(loadouts[0]);
    expect(result.pvp).toContain(loadouts[1]);

    // Each loadout should be in their respective second hashtag groups
    expect(result.trials).toHaveLength(1);
    expect(result.trials).toContain(loadouts[0]);
    expect(result.mw).toHaveLength(1);
    expect(result.mw).toContain(loadouts[1]);
  });

  test('should handle empty hashtags', () => {
    const loadouts: Loadout[] = [
      { id: '1', name: 'Loadout without hashtags', classType: 0, clearSpace: false, items: [] },
      { id: '2', name: 'Another loadout', classType: 0, clearSpace: false, items: [] },
    ];

    const getHashtagsFromLoadout = () => [];

    const result = computeLoadoutsByHashtag(loadouts, getHashtagsFromLoadout);

    // Should return empty object when no hashtags are found
    expect(Object.keys(result)).toHaveLength(0);
  });
});
