import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { EnergyIncrementsWithPresstip } from 'app/dim-ui/EnergyIncrements';
import Sheet from 'app/dim-ui/Sheet';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { inGameArmorEnergyRules } from 'app/loadout-builder/types';
import { Loadout, ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { getLoadoutStats, getModsFromLoadout } from 'app/loadout-drawer/loadout-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { LoadoutStats } from 'app/store-stats/CharacterStats';
import { Portal } from 'app/utils/temp-container';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import Mod from '../loadout-ui/Mod';
import Sockets from '../loadout-ui/Sockets';
import { fitMostMods } from '../mod-assignment-utils';
import { createGetModRenderKey } from '../mod-utils';
import ModPicker from '../ModPicker';
import styles from './ModAssignmentDrawer.m.scss';
import { useEquippedLoadoutArmorAndSubclass } from './selectors';

function Header({
  defs,
  loadout,
  subclass,
  armor,
  mods,
}: {
  defs: D2ManifestDefinitions;
  loadout: Loadout;
  subclass: ResolvedLoadoutItem | undefined;
  armor: DimItem[];
  mods: PluggableInventoryItemDefinition[];
}) {
  const stats = getLoadoutStats(defs, loadout.classType, subclass, armor, mods);

  return (
    <div>
      <h1>{t('Loadouts.ModPlacement')}</h1>
      <div className={styles.headerInfo}>
        <div className={styles.headerName}>{loadout.name}</div>
        <div className={styles.headerStats}>
          <LoadoutStats stats={stats} />
        </div>
      </div>
    </div>
  );
}

export default function ModAssignmentDrawer({
  loadout,
  storeId,
  onUpdateMods,
  onClose,
}: {
  loadout: Loadout;
  storeId: string;
  onUpdateMods?(newMods: PluggableInventoryItemDefinition[]): void;
  onClose(): void;
}) {
  const [plugCategoryHashWhitelist, setPlugCategoryHashWhitelist] = useState<number[]>();

  const defs = useD2Definitions()!;
  const { armor, subclass } = useEquippedLoadoutArmorAndSubclass(loadout, storeId);
  const getModRenderKey = createGetModRenderKey();

  const [itemModAssignments, unassignedMods, mods] = useMemo(() => {
    let mods: PluggableInventoryItemDefinition[] = [];
    getModsFromLoadout(defs, loadout);
    if (defs) {
      mods = getModsFromLoadout(defs, loadout);
    }
    const { itemModAssignments, unassignedMods } = fitMostMods({
      items: armor,
      plannedMods: mods,
      armorEnergyRules: inGameArmorEnergyRules,
    });

    return [itemModAssignments, unassignedMods, mods];
  }, [defs, loadout, armor]);

  const onSocketClick = useCallback(
    (plugDef: PluggableInventoryItemDefinition, plugCategoryHashWhitelist: number[]) => {
      const { plugCategoryHash } = plugDef.plug;

      if (plugCategoryHash === PlugCategoryHashes.Intrinsics) {
        // Do nothing, it's an exotic plug
      } else {
        setPlugCategoryHashWhitelist(plugCategoryHashWhitelist);
      }
    },
    []
  );

  const flatAssigned = _.compact(Object.values(itemModAssignments).flat());

  if (!defs) {
    return null;
  }

  // TODO: button to apply mods
  // TODO: consider existing mods in assignment

  return (
    <>
      <Sheet
        header={
          <Header
            defs={defs}
            loadout={loadout}
            subclass={subclass}
            armor={armor}
            mods={flatAssigned}
          />
        }
        disabled={Boolean(onUpdateMods && plugCategoryHashWhitelist)}
        onClose={onClose}
      >
        <div className={styles.container}>
          <div className={styles.assigned}>
            {armor.map((item) => {
              const energyUsed = _.sumBy(
                itemModAssignments[item.id],
                (m) => m.plug.energyCost?.energyCost || 0
              );

              const adjustedEnergy = item.energy ? { ...item.energy, energyUsed } : null;

              return (
                <div key={item.id} className={styles.itemAndMods}>
                  <div>
                    <ConnectedInventoryItem item={item} />
                    {adjustedEnergy && (
                      <EnergyIncrementsWithPresstip
                        energy={adjustedEnergy}
                        wrapperClass={styles.energyMeter}
                      />
                    )}
                  </div>

                  <Sockets
                    item={item}
                    lockedMods={itemModAssignments[item.id]}
                    onSocketClick={onUpdateMods ? onSocketClick : undefined}
                  />
                </div>
              );
            })}
          </div>
          {unassignedMods.length > 0 && (
            <>
              <h3>{t('Loadouts.UnassignedMods')}</h3>
              <div className={styles.unassigned}>
                {unassignedMods.map((mod) => (
                  <Mod key={getModRenderKey(mod)} plugDef={mod} />
                ))}
              </div>
            </>
          )}
        </div>
      </Sheet>
      {onUpdateMods && plugCategoryHashWhitelist && (
        <Portal>
          <ModPicker
            classType={loadout.classType}
            owner={storeId}
            lockedMods={mods}
            plugCategoryHashWhitelist={plugCategoryHashWhitelist}
            onAccept={onUpdateMods}
            onClose={() => setPlugCategoryHashWhitelist(undefined)}
          />
        </Portal>
      )}
    </>
  );
}
