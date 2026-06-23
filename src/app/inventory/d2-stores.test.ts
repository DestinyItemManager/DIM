import { getWeaponArchetypeSocket } from 'app/utils/socket-utils';
import { BucketHashes } from 'data/d2/generated-enums';
import { getTestDefinitions, getTestStores, setupi18n } from 'testing/test-utils';
import { generateCSVExportData } from './spreadsheets';
import { DimStore } from './store-types';
import { buildDefinedPlug } from './store/sockets';

describe('process stores', () => {
  let stores: DimStore[];
  beforeAll(async () => {
    stores = await getTestStores();
  });

  it('can process stores without errors', async () => {
    expect(stores).toBeDefined();
    expect(stores?.length).toBe(4);
  });

  it("all sockets' plugged is present in the list of plugOptions", async () => {
    for (const store of stores) {
      for (const item of store.items) {
        if (item.sockets) {
          for (const socket of item.sockets.allSockets) {
            if (
              socket.plugged &&
              // the plugged socket must appear in the list of plugOptions
              !socket.plugOptions.includes(socket.plugged)
            ) {
              throw new Error(
                `"${item.name}" - ${socket.plugged.plugDef.displayProperties.name} is not in the list of plugOptions`,
              );
            }
          }
        }
      }
    }
  });

  it('intrinsic sockets should have only one plugOption', async () => {
    for (const store of stores) {
      for (const item of store.items) {
        const archetypeSocket = getWeaponArchetypeSocket(item);
        if (archetypeSocket && archetypeSocket.plugOptions.length > 1) {
          throw new Error(`"${item.name}" has multiple archetype (intrinsic) plug options`);
        }
      }
    }
  });

  // This was a bug once where I forgot to populate plug options for sparrow
  // perks because their reusable plugs list is empty even though they have a
  // plugged plug.
  // Alpine Dash is broken in-game (https://www.bungie.net/7/en/News/article/destiny_2_update_8_0_0_1 search:"Alpine Dash")
  it('sparrows should have perks', async () => {
    for (const store of stores) {
      for (const item of store.items) {
        if (item.hash !== 3981634627 && item.bucket.hash === BucketHashes.Vehicle && item.sockets) {
          for (const socket of item.sockets.allSockets) {
            if (socket.plugOptions.length === 0) {
              throw new Error(`Sparrow "${item.name}" is missing perks`);
            }
          }
        }
      }
    }
  });

  // Another sanity check that stats are working (I messed this up)
  it('items with stats should have at least one nonzero stat', async () => {
    for (const store of stores) {
      for (const item of store.items) {
        if (
          item.stats &&
          // These naturally have all-zero stats
          item.bucket.hash !== BucketHashes.ClassArmor &&
          item.bucket.hash !== BucketHashes.Subclass &&
          !item.stats.some((s) => s.base > 0)
        ) {
          throw new Error(`"${item.name}" has all zero stats`);
        }
      }
    }
  });

  // cannotCurrentlyRoll marks a perk that can no longer drop on a fresh item.
  // We used to assert the sample profile contained such a roll, but that depends
  // on the profile happening to hold a "stuck" item (it no longer does), so test
  // the mechanism directly: buildDefinedPlug sets the flag from currentlyCanRoll.
  it('marks a plug as cannotCurrentlyRoll when the perk cannot currently roll', async () => {
    const defs = await getTestDefinitions();
    // Any real pluggable hash from the sample data, so the def resolves.
    const plugHash = stores
      .flatMap((s) => s.items)
      .flatMap((i) => i.sockets?.allSockets ?? [])
      .find((socket) => socket.plugged)?.plugged!.plugDef.hash;
    expect(plugHash).toBeDefined();

    expect(buildDefinedPlug(defs, plugHash!, false)?.cannotCurrentlyRoll).toBe(true);
    expect(buildDefinedPlug(defs, plugHash!, true)?.cannotCurrentlyRoll).toBe(false);
    // No information about rollability means we don't flag it.
    expect(buildDefinedPlug(defs, plugHash!, undefined)?.cannotCurrentlyRoll).toBe(false);
  });

  test.each(['weapon', 'armor', 'ghost'] as const)(
    'generates a correct %s CSV export',
    async (type) => {
      await setupi18n();
      const getTag = () => undefined;
      const getNotes = () => undefined;
      const loadoutsByItem = {};
      const csvExport = generateCSVExportData(type, stores, getTag, getNotes, loadoutsByItem, []);
      expect(csvExport).toMatchSnapshot();
    },
  );
});
