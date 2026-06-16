import { equip, transfer } from 'app/bungie-api/destiny2-api';
import {
  buildFreshStores,
  findItemsByBucket,
  getVault,
  itemsInBucketUncached,
  setBucketFreeSlots,
  setupMoveTestStore,
} from 'testing/move-item-test-utils';
import { setupi18n } from 'testing/test-utils';
import { DimError } from '../utils/dim-error';
import { DimItem } from './item-types';
import { DimStore } from './store-types';

// Mock the Bungie.net write APIs so moves don't hit the network. Each just
// reports success - the in-memory store model is updated by the reducer, not by
// these responses, so resolving is enough to drive the move logic. (jest hoists
// this above the imports above.)
jest.mock('app/bungie-api/destiny2-api', () => ({
  transfer: jest.fn().mockResolvedValue({}),
  equip: jest.fn().mockResolvedValue({}),
  equipItems: jest.fn(),
  setLockState: jest.fn().mockResolvedValue({}),
  setTrackedState: jest.fn().mockResolvedValue({}),
}));

const transferMock = transfer as jest.Mock;
const equipMock = equip as jest.Mock;

/** Find an item suitable for transfer tests: instanced, transferable, not exotic. */
function findTransferableWeapon(store: DimStore): DimItem | undefined {
  return store.items.find(
    (i) =>
      i.bucket.sort === 'Weapons' &&
      i.instanced &&
      !i.notransfer &&
      !i.location.inPostmaster &&
      !i.equipped &&
      !i.isExotic &&
      Boolean(i.bucket.vaultBucket),
  );
}

describe('item-move-service', () => {
  beforeAll(async () => {
    await setupi18n();
  });

  beforeEach(() => {
    transferMock.mockClear();
    equipMock.mockClear();
    transferMock.mockResolvedValue({});
    equipMock.mockResolvedValue({});
  });

  it('moves an item from the vault to a character', async () => {
    const stores = await buildFreshStores();
    const vault = getVault(stores)!;
    const character = stores.find((s) => !s.isVault)!;

    const item = findTransferableWeapon(vault)!;
    expect(item).toBeDefined();

    // Guarantee there's room on the character for it
    setBucketFreeSlots(character, item.bucket.hash, 3);

    const { getStores, move } = setupMoveTestStore(stores);
    const moved = await move(item, character);

    expect(transferMock).toHaveBeenCalledTimes(1);
    expect(moved.owner).toBe(character.id);

    // The item is no longer in the vault and now lives on the character
    const newStores = getStores();
    const newVault = getVault(newStores)!;
    const newCharacter = newStores.find((s) => s.id === character.id)!;
    expect(newVault.items.some((i) => i.id === item.id)).toBe(false);
    expect(newCharacter.items.some((i) => i.id === item.id)).toBe(true);
  });

  it('moves an item from a character to the vault', async () => {
    const stores = await buildFreshStores();
    const character = stores.find((s) => !s.isVault && findTransferableWeapon(s))!;
    const vault = getVault(stores)!;

    const item = findTransferableWeapon(character)!;
    expect(item).toBeDefined();

    const { getStores, move } = setupMoveTestStore(stores);
    const moved = await move(item, vault);

    expect(transferMock).toHaveBeenCalledTimes(1);
    expect(moved.owner).toBe('vault');

    const newStores = getStores();
    expect(getVault(newStores)!.items.some((i) => i.id === item.id)).toBe(true);
  });

  it('moves an item between two characters via the vault', async () => {
    const stores = await buildFreshStores();
    const characters = stores.filter((s) => !s.isVault);
    const source = characters.find((s) => findTransferableWeapon(s))!;
    const target = characters.find((s) => s.id !== source.id)!;

    const item = findTransferableWeapon(source)!;
    expect(item).toBeDefined();

    setBucketFreeSlots(target, item.bucket.hash, 3);

    const { getStores, move } = setupMoveTestStore(stores);
    const moved = await move(item, target);

    // Character-to-character requires two transfers: source->vault, vault->target
    expect(transferMock).toHaveBeenCalledTimes(2);
    expect(moved.owner).toBe(target.id);

    const newStores = getStores();
    const newTarget = newStores.find((s) => s.id === target.id)!;
    expect(newTarget.items.some((i) => i.id === item.id)).toBe(true);
  });

  it('equips an unequipped item already on a character', async () => {
    const stores = await buildFreshStores();
    const character = stores.find((s) => !s.isVault && findTransferableWeapon(s))!;
    const item = findTransferableWeapon(character)!;
    expect(item).toBeDefined();
    expect(item.equipped).toBe(false);

    const { getStores, move } = setupMoveTestStore(stores);
    await move(item, character, { equip: true });

    expect(equipMock).toHaveBeenCalledTimes(1);

    const newStores = getStores();
    const newCharacter = newStores.find((s) => s.id === character.id)!;
    const equippedInBucket = findItemsByBucket(newCharacter, item.bucket.hash).filter(
      (i) => i.equipped,
    );
    // Exactly one item is equipped in that bucket, and it's ours
    expect(equippedInBucket).toHaveLength(1);
    expect(equippedInBucket[0].id).toBe(item.id);
  });

  it('makes room by moving an item aside when the target bucket is full', async () => {
    const stores = await buildFreshStores();
    const vault = getVault(stores)!;
    // Use a non-current character: moving to the *current* character takes a
    // "blind move" fast path that trusts the API instead of pre-clearing space.
    const character = stores.find((s) => !s.isVault && !s.current)!;

    const item = findTransferableWeapon(vault)!;
    expect(item).toBeDefined();

    // Completely fill the destination bucket on the character
    setBucketFreeSlots(character, item.bucket.hash, 0);
    const capacity = item.bucket.capacity;

    const { getStores, move } = setupMoveTestStore(stores);
    const moved = await move(item, character);

    expect(moved.owner).toBe(character.id);

    const newStores = getStores();
    const newCharacter = newStores.find((s) => s.id === character.id)!;
    // Our item made it in...
    expect(newCharacter.items.some((i) => i.id === item.id)).toBe(true);
    // ...and the bucket didn't exceed its capacity (something was moved aside)
    expect(findItemsByBucket(newCharacter, item.bucket.hash).length).toBeLessThanOrEqual(capacity);
  });

  it('throws a no-space error when nothing can be moved aside', async () => {
    const stores = await buildFreshStores();
    const vault = getVault(stores)!;
    // Non-current character so the move goes through the make-space path rather
    // than a blind move to the current character.
    const character = stores.find((s) => !s.isVault && !s.current)!;

    const item = findTransferableWeapon(vault)!;
    expect(item).toBeDefined();

    // Fill the destination bucket on the character, and make every item in it
    // un-moveable so DIM can't free up a slot.
    setBucketFreeSlots(character, item.bucket.hash, 0);
    for (const i of itemsInBucketUncached(character, item.bucket.hash)) {
      i.notransfer = true;
    }

    const { move } = setupMoveTestStore(stores);

    await expect(move(item, character)).rejects.toThrow(DimError);
    expect(transferMock).not.toHaveBeenCalled();
  });
});
