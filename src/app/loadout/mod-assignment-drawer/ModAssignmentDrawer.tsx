import { UpgradeSpendTier } from '@destinyitemmanager/dim-api-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import Sheet from 'app/dim-ui/Sheet';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { isModStatActive } from 'app/loadout-builder/process/mappers';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { getArmorStats } from 'app/loadout-drawer/loadout-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { LoadoutStats } from 'app/store-stats/CharacterStats';
import React, { useMemo } from 'react';
import Mod from '../loadout-ui/Mod';
import Sockets from '../loadout-ui/Sockets';
import { getCheapestModAssignments } from '../mod-utils';
import styles from './ModAssignmentDrawer.m.scss';
import { useEquippedLoadoutArmor, useLoadoutMods } from './selectors';

function Header({
  defs,
  loadout,
  armor,
  mods,
}: {
  defs: D2ManifestDefinitions;
  loadout: Loadout;
  armor: DimItem[];
  mods: PluggableInventoryItemDefinition[];
}) {
  const stats = getArmorStats(defs, armor);

  for (const mod of mods) {
    for (const stat of mod.investmentStats) {
      if (stat.statTypeHash in stats && isModStatActive(loadout.classType, mod.hash, stat, mods)) {
        stats[stat.statTypeHash].value += stat.value;
      }
    }
  }

  return (
    <div>
      <h1>Mod Assignments</h1>
      <div className={styles.headerInfo}>
        <div className={styles.headerName}>{loadout.name}</div>
        <div className={styles.headerStats}>
          <LoadoutStats stats={stats} characterClass={loadout.classType} />
        </div>
      </div>
    </div>
  );
}

function ModAssignmentDrawer({ loadout, onClose }: { loadout: Loadout; onClose(): void }) {
  const defs = useD2Definitions();
  const armor = useEquippedLoadoutArmor(loadout);
  const mods = useLoadoutMods(loadout);

  const { itemModAssignments, unassignedMods } = useMemo(
    () => getCheapestModAssignments(armor, mods, defs, UpgradeSpendTier.Nothing, true),
    [defs, armor, mods]
  );

  const flatAssigned = Array.from(itemModAssignments.values()).flat();

  if (!defs) {
    return null;
  }

  return (
    <Sheet
      header={<Header defs={defs} loadout={loadout} armor={armor} mods={flatAssigned} />}
      onClose={onClose}
    >
      <div className={styles.container}>
        <div className={styles.assigned}>
          {armor.map((item) => (
            <div key={item.id} className={styles.itemAndMods}>
              <ConnectedInventoryItem item={item} />
              <Sockets item={item} lockedMods={itemModAssignments.get(item.id)} />
            </div>
          ))}
        </div>
        <h3>Unassigned Mods</h3>
        <div className={styles.unassigned}>
          {unassignedMods.map((mod) => (
            <Mod key={mod.hash} plugDef={mod} />
          ))}
        </div>
      </div>
    </Sheet>
  );
}

export default ModAssignmentDrawer;
