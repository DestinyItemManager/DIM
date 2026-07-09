import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { armorStats } from 'app/search/d2-known-values';
import { mapValues } from 'app/utils/collections';
import { emptySet } from 'app/utils/empty';
import { getTestDefinitions } from 'testing/test-utils';
import { chooseAutoMods } from '../process-worker/auto-stat-mod-utils';
import { precalculateStructures } from '../process-worker/process-utils';
import { ProcessMod } from '../process-worker/types';
import { getAutoMods, mapAutoMods } from '../process/mappers';
import { generalSocketReusablePlugSetHash } from '../types';

// The tsconfig in the process worker folder messes with tests so they live outside of it.
describe('process-utils auto mod structure', () => {
  let defs: D2ManifestDefinitions;
  beforeAll(async () => {
    defs = await getTestDefinitions();
  });

  const generalMods: ProcessMod[] = [
    { hash: 7, energyCost: 3 },
    { hash: 8, energyCost: 5 },
    { hash: 9, energyCost: 2 },
    { hash: 10, energyCost: 1 },
    { hash: 11, energyCost: 2 },
  ];

  test.each(['general', 'cheapgeneral'] as const)(
    'snapshot of mod defs when assuming %s for auto mods',
    (n) => {
      const unlockedPlugs =
        n === 'cheapgeneral'
          ? new Set([
              ...defs.PlugSet.get(generalSocketReusablePlugSetHash).reusablePlugItems.map(
                (entry) => entry.plugItemHash,
              ),
            ])
          : emptySet<number>();
      const autoModData = mapAutoMods(getAutoMods(defs, unlockedPlugs));
      expect(autoModData).toMatchSnapshot();
    },
  );

  test.each([
    [5, false],
    [3, false],
    [1, true],
    [0, true],
    [5, true],
  ] as const)(
    'different ways of hitting target stats with %s remaining general mods (using artifice mods: %s)',
    (numGeneralMods, useArtificeMods) => {
      const unlockedPlugs = emptySet<number>();
      const autoModData = mapAutoMods(getAutoMods(defs, unlockedPlugs));
      if (!useArtificeMods) {
        autoModData.artificeMods = {};
      }
      const sessionInfo = precalculateStructures(
        autoModData,
        generalMods.slice(0, 5 - numGeneralMods),
        [],
        true,
        armorStats,
      );
      const waysOfHittingStat = mapValues(sessionInfo.autoModOptions[3], (y) => y?.length);
      // Things to watch out for in the snapshot: Keys are contiguous, values first ascend
      // to around the halfway point before descending in a vaguely binomial coefficient-like fashion
      expect(waysOfHittingStat).toMatchSnapshot();
    },
  );

  test('chooseAutoMods memoizes across permuted-but-equal inputs and distinguishes different ones', () => {
    const autoModData = mapAutoMods(getAutoMods(defs, emptySet<number>()));
    const sessionInfo = precalculateStructures(autoModData, [], [], true, armorStats);

    const pick = chooseAutoMods(sessionInfo, [10, 0, 0, 5, 0, 0], 2, [[3, 10, 0, 7, 4]], 24);
    expect(pick).toBeDefined();
    // Same energies as a different permutation must hit the same memo entry
    // (energy vectors are multisets), returning the identical result array.
    const permuted = chooseAutoMods(sessionInfo, [10, 0, 0, 5, 0, 0], 2, [[10, 7, 4, 3, 0]], 24);
    expect(permuted).toBe(pick);
    // Different needs must not falsely hit
    const different = chooseAutoMods(sessionInfo, [15, 0, 0, 5, 0, 0], 2, [[3, 10, 0, 7, 4]], 24);
    expect(different).not.toBe(pick);
    // ...and a fresh un-memoized session must agree with the memoized results
    const freshInfo = precalculateStructures(autoModData, [], [], true, armorStats);
    expect(chooseAutoMods(freshInfo, [10, 0, 0, 5, 0, 0], 2, [[3, 10, 0, 7, 4]], 24)).toEqual(pick);
  });
});
