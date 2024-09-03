import { getWeaponArchetypeSocket } from 'app/utils/socket-utils';
import { BucketHashes } from 'data/d2/generated-enums';
import { getTestStores, setupi18n } from 'testing/test-utils';
import { generateCSVExportData } from './spreadsheets';
import { DimStore } from './store-types';

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

  // This relies on the sample profile having at least one item that has a plug
  // that can no longer roll. I keep a Commemoration around for that.
  it('item perks can be marked as cannotCurrentlyRoll', async () => {
    for (const store of stores) {
      for (const item of store.items) {
        if (
          item.sockets?.allSockets.some((s) => s.plugOptions.some((p) => p.cannotCurrentlyRoll))
        ) {
          return; // All good, we found one!
        }
      }
    }
    throw new Error('Expected at least one item with a perk that cannot roll');
  });

  test.each(['weapon', 'armor', 'ghost'] as const)('generates a correct %s CSV export', (type) => {
    setupi18n();
    const getTag = () => undefined;
    const getNotes = () => undefined;
    const loadoutsByItem = {};
    const csvExport = generateCSVExportData(type, stores, getTag, getNotes, loadoutsByItem, []);
    expect(csvExport).toMatchSnapshot();
  });
});
