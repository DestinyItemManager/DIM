import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { DimItem, PluggableInventoryItemDefinition } from '../inventory/item-types';
import { ProcessItem, ProcessMod } from './process-worker/types';

const DEFAULT_ENERGY_INVESTMENT = 1000;

interface ItemAssignments {
  mods: ProcessMod[];
  energySwapped: boolean;
}

export class ModAssignments {
  // We just keep track of the id's and hashes as we assume only valid items and mod
  // combninations are passed in
  private slotDependantAssignments: Map<string, number[]>;
  // We need to keep track of a bit more data here so we track the item and the data
  // kept in ItemAssignments
  private slotIndependantAssignments: Map<ProcessItem, ItemAssignments>;
  // Keep track of the current set of assignments extra energy investment so we dont
  // need to continually recalculate it
  private extraEnergyInvestment = DEFAULT_ENERGY_INVESTMENT;

  constructor() {
    this.slotDependantAssignments = new Map();
    this.slotIndependantAssignments = new Map();
  }

  get isSuccessfullyAssigned() {
    return this.extraEnergyInvestment < DEFAULT_ENERGY_INVESTMENT;
  }

  /**
   * This returns a map of item id's to mod hashes for the assigned mods.
   */
  getResults() {
    const rtn = new Map<string, number[]>();

    for (const [item, itemAssignments] of this.slotIndependantAssignments.entries()) {
      rtn.set(
        item.id,
        itemAssignments.mods.map((mod) => mod.hash)
      );
    }

    for (const [itemId, mods] of this.slotDependantAssignments.entries()) {
      if (rtn.has(itemId)) {
        rtn.get(itemId)?.push(...mods);
      } else {
        rtn.set(itemId, mods);
      }
    }

    return rtn;
  }

  /**
   * Assigns slot dependant mods (i.e. helmet mods) to the item.
   */
  assignSlotDependantMods(item: DimItem, mods: PluggableInventoryItemDefinition[]) {
    this.slotDependantAssignments.set(
      item.id,
      mods.map((mod) => mod.hash)
    );
  }

  // Calculates the energy used and wasted for an item and its assignments.
  private calculateEnergyChange(item: ProcessItem, assignments: ItemAssignments) {
    const modCost =
      (item.energy?.val || 0) + _.sumBy(assignments.mods, (mod) => mod.energy?.val || 0);
    const energyUsedAndWasted = modCost + (item.energy?.originalCapacity || 0);
    const energyInvested = Math.max(0, modCost - (item.energy?.originalCapacity || 0));
    return assignments.energySwapped ? energyUsedAndWasted : energyInvested;
  }

  /**
   * This method is used to keep track of the set of mods with the least amount of energy
   * that needs to be invested to fit them.
   *
   * It does this by calculating the energy that is needed to be invested in the item and
   * the energy wasted by swapping element. For example
   * - If we have an item with 2 enegy and an aligned mod has 5 energy and a matching type
   * we determine that to be a cost of 3.
   * - If we have an item with 2 enegy and an aligned mod has 5 energy and a differing type
   * we determine that to be a cost of 2 + 5 = 7.
   *
   * This will ensure we heavily favour matching energy types.
   *
   * TODO (ryan) I don't like that these are tied to process items. Lets make a new version
   * of the mod assignment algorithm that takes dim items and house it in here.
   */
  assignSlotIndependantModsIfLessEnergyTypeSwaps(
    newItems: ProcessItem[],
    newGeneralMods: (ProcessMod | null)[],
    newOtherMods: (ProcessMod | null)[],
    newRaidMods: (ProcessMod | null)[]
  ) {
    const newAssignments = new Map<ProcessItem, ItemAssignments>();

    for (const [i, item] of newItems.entries()) {
      const newAssignment: ItemAssignments = {
        mods: [],
        energySwapped: false,
      };

      for (const mods of [newGeneralMods, newOtherMods, newRaidMods]) {
        const mod = mods[i];
        if (!mod) {
          continue;
        }

        newAssignment.mods.push(mod);

        // Check to see if we have swapped energy type from the items original energy.
        if (
          !newAssignment.energySwapped &&
          mod.energy?.type !== DestinyEnergyType.Any &&
          mod.energy?.type !== item.energy?.originalEnergyType
        ) {
          newAssignment.energySwapped = true;
        }
      }

      newAssignments.set(item, newAssignment);
    }

    const newExtraEnergyInvestment = _.sumBy(
      Array.from(newAssignments.entries()),
      ([item, itemAssignments]) => this.calculateEnergyChange(item, itemAssignments)
    );

    if (newExtraEnergyInvestment > this.extraEnergyInvestment) {
      return;
    }

    // If we have made it this far we have successfully found a set of assigments with less swaps.
    this.slotIndependantAssignments = newAssignments;
    this.extraEnergyInvestment = newExtraEnergyInvestment;
  }
}
