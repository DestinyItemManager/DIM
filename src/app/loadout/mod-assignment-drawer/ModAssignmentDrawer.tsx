import { UpgradeSpendTier } from '@destinyitemmanager/dim-api-types';
import Sheet from 'app/dim-ui/Sheet';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { useD2Definitions } from 'app/manifest/selectors';
import React, { useMemo } from 'react';
import Mod from '../loadout-ui/Mod';
import Sockets from '../loadout-ui/Sockets';
import { getCheapestModAssignments } from '../mod-utils';
import styles from './ModAssignmentDrawer.m.scss';
import { useEquippedLoadoutArmor, useLoadoutMods } from './selectors';

function ModAssignmentDrawer({ loadout, onClose }: { loadout: Loadout; onClose(): void }) {
  const defs = useD2Definitions();
  const armor = useEquippedLoadoutArmor(loadout);
  const mods = useLoadoutMods(loadout);

  const [assigned, unassigned] = useMemo(
    () => getCheapestModAssignments(armor, mods, defs, UpgradeSpendTier.Nothing, true),
    [defs, armor, mods]
  );

  return (
    <Sheet header={<h1>Mod Assignments</h1>} onClose={onClose}>
      <div className={styles.container}>
        <div className={styles.assigned}>
          {armor.map((item) => (
            <div key={item.id} className={styles.itemAndMods}>
              <ConnectedInventoryItem item={item} />
              <Sockets item={item} lockedMods={assigned.get(item.id)} />
            </div>
          ))}
        </div>
        <h3>Unassigned Mods</h3>
        <div className={styles.unassigned}>
          {unassigned.map((mod) => (
            <Mod key={mod.hash} plugDef={mod} />
          ))}
        </div>
      </div>
    </Sheet>
  );
}

export default ModAssignmentDrawer;
