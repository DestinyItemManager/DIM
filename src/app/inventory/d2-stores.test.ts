import { getWeaponArchetypeSocket } from 'app/utils/socket-utils';
import { BucketHashes } from 'data/d2/generated-enums';
import { getTestStores } from 'testing/test-utils';
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
            if (socket.plugged) {
              // the plugged socket must appear in the list of plugOptions
              if (!socket.plugOptions.includes(socket.plugged)) {
                throw new Error(
                  `"${item.name}" - ${socket.plugged.plugDef.displayProperties.name} is not in the list of plugOptions`
                );
              }
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
  it('sparrows should have perks', async () => {
    for (const store of stores) {
      for (const item of store.items) {
        if (item.bucket.hash === BucketHashes.Vehicle && item.sockets) {
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
          item.bucket.hash !== BucketHashes.Subclass
        ) {
          if (!item.stats.some((s) => s.base > 0)) {
            throw new Error(`"${item.name}" has all zero stats`);
          }
        }
      }
    }
  });
});
