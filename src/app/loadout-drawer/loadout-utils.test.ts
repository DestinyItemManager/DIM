import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { getTestDefinitions } from 'testing/test-utils';
import { resolveLoadoutModHashes } from './loadout-utils';

describe('resolveLoadoutModHashes', () => {
  let defs: D2ManifestDefinitions;

  beforeAll(async () => {
    defs = await getTestDefinitions();
  });

  // The LO worker stores tuning mods in canonical slot order and fitMostMods relies
  // on that order to put each one back on the right piece. resolveLoadoutModHashes
  // must preserve stored order (display sorting lives in the render components), so
  // this guards against a sort being reintroduced here. Tuning mods are the case
  // that matters: they share a plug category, type name, and (zero) energy cost, so
  // sortMods would order them by name.
  it('preserves the order of tuning mods', () => {
    const grenadeTuning = 455024236; // "+Grenade / ..."
    const superTuning = 4026414261; // "+Super / ..."
    const nameOf = (hash: number) =>
      (defs.InventoryItem.get(hash) as PluggableInventoryItemDefinition).displayProperties.name;

    // Feed them in the order a name sort would flip, so this fails if the sort
    // (which used to scramble tuning assignment) is ever reintroduced.
    const [first, second] =
      nameOf(grenadeTuning) < nameOf(superTuning)
        ? [superTuning, grenadeTuning]
        : [grenadeTuning, superTuning];

    const resolved = resolveLoadoutModHashes(defs, [first, second], new Set());
    expect(resolved.map((mod) => mod.originalModHash)).toEqual([first, second]);
  });
});
