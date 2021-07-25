import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { DimItem, PluggableInventoryItemDefinition } from '../../inventory/item-types';
import { ProcessItem, ProcessMod } from './types';

interface ItemAssignments {
  mods: ProcessMod[];
  energySwapped: boolean;
}

export class ModAssignments {
  private slotDependantAssignments: Map<string, number[]>;
  private slotIndependantAssignments: Map<ProcessItem, ItemAssignments>;
  private extraEnergyInvestment = 1000;
  combinationsChecked = 0;

  constructor() {
    this.slotDependantAssignments = new Map();
    this.slotIndependantAssignments = new Map();
  }

  get assignmentFound() {
    return this.extraEnergyInvestment < 1000;
  }

  // gets a minimal set of data for the UI
  get results() {
    const rtn: Record<string, number[]> = {};

    // eslint-disable-next-line no-console
    console.log(`Energy invested: ${this.extraEnergyInvestment}`);
    // eslint-disable-next-line no-console
    console.log(`Combos checked: ${this.combinationsChecked}`);

    for (const [item, itemAssignments] of this.slotIndependantAssignments.entries()) {
      if (!rtn[item.id]) {
        rtn[item.id] = itemAssignments.mods.map((mod) => mod.hash);
      }
    }

    for (const [itemId, mods] of this.slotDependantAssignments.entries()) {
      if (!rtn[itemId]) {
        rtn[itemId] = mods;
      } else {
        rtn[itemId] = [...rtn[itemId], ...mods];
      }
    }

    return rtn;
  }

  assignSlotDependantMods(item: DimItem, mods: PluggableInventoryItemDefinition[]) {
    this.slotDependantAssignments.set(
      item.id,
      mods.map((mod) => mod.hash)
    );
  }

  assignSlotIndependantModsIfLessEnergyTypeSwaps(
    newItems: ProcessItem[],
    newGeneralMods: (ProcessMod | null)[],
    newOtherMods: (ProcessMod | null)[],
    newRaidMods: (ProcessMod | null)[]
  ) {
    this.combinationsChecked++;
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
      [...newAssignments.entries()],
      ([item, assignment]) => {
        const modCost =
          (item.energy?.val || 0) + _.sumBy(assignment.mods, (mod) => mod.energy?.val || 0);
        const energyUsedAndWasted = modCost + (item.energy?.capacity || 0);
        const energyInvested = Math.max(0, modCost - (item.energy?.capacity || 0));
        return assignment.energySwapped ? energyUsedAndWasted : energyInvested;
      }
    );

    if (newExtraEnergyInvestment > this.extraEnergyInvestment) {
      return;
    }

    // If we have made it this far we have successfully found a set of assigments with less swaps.
    this.slotIndependantAssignments = newAssignments;
    this.extraEnergyInvestment = newExtraEnergyInvestment;
  }
}
