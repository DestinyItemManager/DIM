import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import Sheet from 'app/dim-ui/Sheet';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { isModStatActive } from 'app/loadout-builder/process/mappers';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { getArmorStats } from 'app/loadout-drawer/loadout-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { LoadoutStats } from 'app/store-stats/CharacterStats';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { RefObject, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import Mod from '../loadout-ui/Mod';
import Sockets from '../loadout-ui/Sockets';
import {
  compactModAssignments,
  createGetModRenderKey,
  getCheapestModAssignments,
} from '../mod-utils';
import ModPicker from '../ModPicker';
import styles from './ModAssignmentDrawer.m.scss';
import { useEquippedLoadoutArmor } from './selectors';

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
      <h1>{t('Loadouts.ModPlacement')}</h1>
      <div className={styles.headerInfo}>
        <div className={styles.headerName}>{loadout.name}</div>
        <div className={styles.headerStats}>
          <LoadoutStats stats={stats} characterClass={loadout.classType} />
        </div>
      </div>
    </div>
  );
}

export default function ModAssignmentDrawer({
  loadout,
  minHeight,
  sheetRef,
  onUpdateMods,
  onClose,
}: {
  loadout: Loadout;
  minHeight?: number;
  /** A ref passed down to the sheets container. */
  sheetRef?: RefObject<HTMLDivElement>;
  onUpdateMods(newMods: PluggableInventoryItemDefinition[]): void;
  onClose(): void;
}) {
  const [plugCategoryHashWhitelist, setPlugCategoryHashWhitelist] = useState<number[]>();

  const defs = useD2Definitions()!;
  const armor = useEquippedLoadoutArmor(loadout);
  const getModRenderKey = createGetModRenderKey();

  const [itemModAssignments, unassignedMods, mods] = useMemo(() => {
    let mods: PluggableInventoryItemDefinition[] = [];
    if (defs && loadout.parameters?.mods?.length) {
      mods = loadout.parameters?.mods
        .map((hash) => defs.InventoryItem.get(hash))
        .filter(isPluggableItem);
    }
    const { itemModAssignments, unassignedMods } = getCheapestModAssignments(armor, mods, defs);

    return [compactModAssignments(itemModAssignments), unassignedMods, mods];
  }, [defs, armor, loadout.parameters?.mods]);

  const onSocketClick = (
    plugDef: PluggableInventoryItemDefinition,
    plugCategoryHashWhitelist: number[]
  ) => {
    const { plugCategoryHash } = plugDef.plug;

    if (plugCategoryHash === PlugCategoryHashes.Intrinsics) {
      // Do nothing, it's an exotic plug
    } else {
      setPlugCategoryHashWhitelist(plugCategoryHashWhitelist);
    }
  };

  const flatAssigned = _.compact(Object.values(itemModAssignments).flat());

  if (!defs) {
    return null;
  }

  // TODO: button to apply mods
  // TODO: consider existing mods in assignment

  return (
    <>
      <Sheet
        header={<Header defs={defs} loadout={loadout} armor={armor} mods={flatAssigned} />}
        ref={sheetRef}
        minHeight={minHeight}
        onClose={onClose}
      >
        <div className={styles.container}>
          <div className={styles.assigned}>
            {armor.map((item) => (
              <div key={item.id} className={styles.itemAndMods}>
                <ConnectedInventoryItem item={item} />
                <Sockets
                  item={item}
                  lockedMods={itemModAssignments[item.id]}
                  onSocketClick={onSocketClick}
                />
              </div>
            ))}
          </div>
          <h3>{t('Loadouts.UnassignedMods')}</h3>
          <div className={styles.unassigned}>
            {unassignedMods.map((mod) => (
              <Mod key={getModRenderKey(mod)} plugDef={mod} />
            ))}
          </div>
        </div>
      </Sheet>
      {plugCategoryHashWhitelist &&
        ReactDOM.createPortal(
          <ModPicker
            classType={loadout.classType}
            lockedMods={mods}
            plugCategoryHashWhitelist={plugCategoryHashWhitelist}
            onAccept={onUpdateMods}
            onClose={() => {
              setPlugCategoryHashWhitelist(undefined);
            }}
          />,
          document.body
        )}
    </>
  );
}
