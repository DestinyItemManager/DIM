import { getExpectedRotatingDungeonHashes, resolveRotatingDungeonHashes } from './dungeon-rotation';

const SHATTERED_THRONE = 2032534090;
const GRASP_OF_AVARICE = 4078656646;
const DUALITY = 2823159265;
const SPIRE_OF_THE_WATCHER = 1262462921;
const GHOSTS_OF_THE_DEEP = 313828469;
const WARLORDS_RUIN = 2004855007;
const VESPERS_HOST = 300092127;
const SUNDERED_DOCTRINE = 3834447244;
const PROPHECY = 1077850348;

describe('dungeon rotation', () => {
  it('advances both rotation slots across weekly resets', () => {
    expect(getExpectedRotatingDungeonHashes(Date.parse('2026-11-17T17:00:00Z'))).toEqual([
      GRASP_OF_AVARICE,
      WARLORDS_RUIN,
    ]);

    expect(getExpectedRotatingDungeonHashes(Date.parse('2026-11-24T17:00:00Z'))).toEqual([
      DUALITY,
      VESPERS_HOST,
    ]);

    expect(getExpectedRotatingDungeonHashes(Date.parse('2026-12-01T17:00:00Z'))).toEqual([
      SPIRE_OF_THE_WATCHER,
      SUNDERED_DOCTRINE,
    ]);

    // The second slot wraps back to the start of the sequence.
    expect(getExpectedRotatingDungeonHashes(Date.parse('2026-12-08T17:00:00Z'))).toEqual([
      GHOSTS_OF_THE_DEEP,
      SHATTERED_THRONE,
    ]);
  });

  it('prefers a complete live rotation over the calculated fallback', () => {
    expect(
      resolveRotatingDungeonHashes(
        [GRASP_OF_AVARICE, WARLORDS_RUIN],
        Date.parse('2026-11-24T17:00:00Z'),
      ),
    ).toEqual([GRASP_OF_AVARICE, WARLORDS_RUIN]);
  });

  it('fills incomplete live data while preserving unexpected live data', () => {
    const reset = Date.parse('2026-11-24T17:00:00Z');

    expect(resolveRotatingDungeonHashes([], reset)).toEqual([DUALITY, VESPERS_HOST]);

    expect(resolveRotatingDungeonHashes([DUALITY], reset)).toEqual([DUALITY, VESPERS_HOST]);

    expect(resolveRotatingDungeonHashes([PROPHECY], reset)).toEqual([
      DUALITY,
      VESPERS_HOST,
      PROPHECY,
    ]);
  });
});
