import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { buildDefinedPlug } from 'app/inventory/store/sockets';
import { Assignment, PluggingAction } from 'app/loadout/loadout-types';
import { count } from 'app/utils/collections';
import { getInterestingSocketMetadatas } from 'app/utils/item-utils';
import { plugFitsIntoSocket } from 'app/utils/socket-utils';
import { produce } from 'immer';
import {
  bulwarkFinishModHash,
  classStatModHash,
  empoweringFinishModHash,
  isArmor2ClassItem,
  reaperModHash,
} from 'testing/test-item-utils';
import { getTestDefinitions, getTestStores } from 'testing/test-utils';
import { createPluggingStrategy, pickPlugPositions } from './mod-assignment-utils';
import { getModExclusionGroup } from './mod-utils';

function processAction(defs: D2ManifestDefinitions, originalItem: DimItem, action: PluggingAction) {
  return produce(originalItem, (item) => {
    const targetedSocket = item.sockets!.allSockets.find(
      (socket) => socket.socketIndex === action.socketIndex,
    )!;

    // DIM internally ensures no-ops don't make it to Bungie.net,
    // but they're required for UI progress reporting.
    if (targetedSocket.plugged!.plugDef.hash === action.mod.hash) {
      return;
    }

    if (!plugFitsIntoSocket(targetedSocket, action.mod.hash)) {
      throw new Error('mod does not fit into this socket');
    }

    const existingExclusionGroup = getModExclusionGroup(targetedSocket.plugged!.plugDef);
    const newExclusionGroup = getModExclusionGroup(action.mod);
    const existingCost = targetedSocket.plugged!.plugDef.plug.energyCost?.energyCost ?? 0;
    const newCost = action.mod.plug.energyCost?.energyCost ?? 0;

    if (existingExclusionGroup !== undefined && existingExclusionGroup === newExclusionGroup) {
      throw new Error(
        'trying to replace mod with mutual exclusion behavior with new mod in same exclusion group',
      );
    }

    if (
      newExclusionGroup !== undefined &&
      item.sockets!.allSockets.some(
        (socket) =>
          socket.plugged && getModExclusionGroup(socket.plugged.plugDef) === newExclusionGroup,
      )
    ) {
      throw new Error(
        'trying to plug mod with mutual exclusion behavior while other mod in same exclusion group still plugged',
      );
    }

    if (newCost > item.energy!.energyUnused + existingCost) {
      throw new Error('trying to plug into item with insufficient energy');
    }

    item.energy!.energyUsed += newCost - existingCost;
    item.energy!.energyUnused -= newCost - existingCost;
    targetedSocket.plugged = buildDefinedPlug(defs, action.mod.hash);
    targetedSocket.plugOptions = [targetedSocket.plugged!];
  });
}

/** Simulate the pluggingActions and update the item accordingly */
function processActions(
  defs: D2ManifestDefinitions,
  originalItem: DimItem,
  actions: PluggingAction[],
) {
  let tempItem = originalItem;
  for (const action of actions) {
    if (action.required) {
      tempItem = processAction(defs, tempItem, action);
    }
  }
  return tempItem;
}

describe('mod-assignment-utils plugging strategy', () => {
  let defs: D2ManifestDefinitions;
  let classItem: DimItem;
  let classStatMod: PluggableInventoryItemDefinition;
  let empoweringFinishMod: PluggableInventoryItemDefinition;
  let bulwarkFinishMod: PluggableInventoryItemDefinition;
  let reaperMod: PluggableInventoryItemDefinition;

  let resetAssignments: Assignment[];

  // Here we build an item-under-test with its assignments to reset it to empty
  beforeAll(async () => {
    const [defs_, stores] = await Promise.all([getTestDefinitions(), getTestStores()]);
    defs = defs_;
    foundItem: for (const store of stores) {
      for (const storeItem of store.items) {
        if (isArmor2ClassItem(storeItem) && !getInterestingSocketMetadatas(storeItem)) {
          classItem = storeItem;
          break foundItem;
        }
      }
    }

    empoweringFinishMod = defs.InventoryItem.get(
      empoweringFinishModHash,
    ) as PluggableInventoryItemDefinition;
    bulwarkFinishMod = defs.InventoryItem.get(
      bulwarkFinishModHash,
    ) as PluggableInventoryItemDefinition;
    classStatMod = defs.InventoryItem.get(classStatModHash) as PluggableInventoryItemDefinition;
    reaperMod = defs.InventoryItem.get(reaperModHash) as PluggableInventoryItemDefinition;

    const exclusionGroup1 = getModExclusionGroup(empoweringFinishMod);
    const exclusionGroup2 = getModExclusionGroup(bulwarkFinishMod);
    expect(exclusionGroup1).not.toBeUndefined();
    expect(exclusionGroup1).toBe(exclusionGroup2);

    resetAssignments = pickPlugPositions(defs, classItem, [], true);
    const actions = createPluggingStrategy(defs, classItem, resetAssignments);
    classItem = processActions(defs, classItem, actions);
    expect(classItem.energy!.energyUsed).toBe(0);
    classItem = {
      ...classItem,
      energy: { ...classItem.energy!, energyCapacity: 5, energyUsed: 0, energyUnused: 5 },
    };
  });

  it('reset assignments are present and required', () => {
    // The item has no specialty sockets, so it should have 4 armor mod sockets
    expect(resetAssignments).toHaveLength(4);
    for (const assignment of resetAssignments) {
      expect(assignment.requested).toBe(true);
    }
  });

  function applyMods(
    item: DimItem,
    mods: PluggableInventoryItemDefinition[],
    assertNumRequiredActions?: number,
  ) {
    const positions = pickPlugPositions(defs, item, mods);
    const strategy = createPluggingStrategy(defs, item, positions);
    const newItem = processActions(defs, item, strategy);
    if (assertNumRequiredActions !== undefined) {
      checkNumRequiredActions(strategy, assertNumRequiredActions);
    }
    return newItem;
  }

  function checkNumRequiredActions(strategy: PluggingAction[], num: number) {
    expect(count(strategy, (action) => action.required)).toBe(num);
  }

  it('keeps existing mod in place if removal optional', () => {
    // Now has 3 used, 2 left.
    const ourItem = applyMods(classItem, [classStatMod]);
    expect(ourItem.energy?.energyUsed).toBe(3);
    expect(empoweringFinishMod.plug.energyCost!.energyCost).toBe(1);
    // Apply a 1-cost mod
    const newItem = applyMods(ourItem, [empoweringFinishMod], 1);
    expect(newItem.energy?.energyUsed).toBe(4);
  });

  it('removes existing mod if needed', () => {
    // Now has 3 used, 2 left.
    const ourItem = applyMods(classItem, [classStatMod]);
    // Apply a 3-cost mod
    const newItem = applyMods(ourItem, [reaperMod], 2);
    expect(newItem.energy?.energyUsed).toBe(3);
  });

  it('prefers replacing mutual exclusion mod', () => {
    // 4 used, 1 left (w/ mutex)
    const ourItem = applyMods(classItem, [reaperMod, empoweringFinishMod]);
    const empoweringIndex = ourItem.sockets!.allSockets.findIndex(
      (socket) => socket.plugged?.plugDef.hash === empoweringFinishMod.hash,
    );
    expect(ourItem.energy?.energyUsed).toBe(4);
    // Apply a 1-cost mutex mod, this should replace the other 1-cost mod
    const newItem = applyMods(ourItem, [bulwarkFinishMod], 2);
    const bulwarkIndex = newItem.sockets!.allSockets.findIndex(
      (socket) => socket.plugged?.plugDef.hash === bulwarkFinishMod.hash,
    );
    expect(empoweringIndex).toBe(bulwarkIndex);
    expect(newItem.energy?.energyUsed).toBe(4);
  });

  it('succeeds even if we choose not to replace in same slot', () => {
    // 4 used, 1 left (w/ mutex)
    const ourItem = applyMods(classItem, [reaperMod, empoweringFinishMod]);
    expect(ourItem.energy?.energyUsed).toBe(4);

    // hack: since original mods are assigned left-to-right, find the adjacent socket optionally to be reset,
    // and swap them so that the new mutex mod is applied to the empty socket and the existing mutex mod
    // is optionally reset to empty
    const positions = pickPlugPositions(defs, ourItem, [bulwarkFinishMod]);
    const bulwarkPosition = positions.find((pos) => pos.mod === bulwarkFinishMod)!;
    const resetPosition = positions.find(
      (pos) => pos.socketIndex === bulwarkPosition.socketIndex + 1 && !pos.requested,
    )!;
    bulwarkPosition.socketIndex += 1;
    resetPosition.socketIndex -= 1;
    const strategy = createPluggingStrategy(defs, ourItem, positions);
    const newItem = processActions(defs, ourItem, strategy);
    checkNumRequiredActions(strategy, 2);
    expect(newItem.energy?.energyUsed).toBe(4);
  });

  // There's some situations we currently can't test -- e.g. the circular dependency in
  // https://github.com/DestinyItemManager/DIM/issues/7465#issuecomment-1379112834 because
  // currently all mutex mods have the same energy cost -- 1.
});
