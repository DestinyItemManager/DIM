import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { EnergyIncrementsWithPresstip } from 'app/dim-ui/EnergyIncrements';
import Sheet from 'app/dim-ui/Sheet';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { EnergySwap } from 'app/loadout-builder/generated-sets/GeneratedSetItem';
import { permissiveArmorEnergyRules } from 'app/loadout-builder/types';
import { Loadout, ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { getLoadoutStats } from 'app/loadout-drawer/loadout-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { LoadoutStats } from 'app/store-stats/CharacterStats';
import { Portal } from 'app/utils/temp-container';
import Cost from 'app/vendors/Cost';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import ModPicker from '../ModPicker';
import PlugDef from '../loadout-ui/PlugDef';
import Sockets from '../loadout-ui/Sockets';
import { fitMostMods } from '../mod-assignment-utils';
import { createGetModRenderKey } from '../mod-utils';
import styles from './ModAssignmentDrawer.m.scss';
import { useEquippedLoadoutArmorAndSubclass, useLoadoutMods } from './selectors';

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
  onUpdateMods?: (newMods: number[]) => void;
  onClose: () => void;
}) {
  const [plugCategoryHashWhitelist, setPlugCategoryHashWhitelist] = useState<number[]>();

  const defs = useD2Definitions()!;
  const { armor, subclass } = useEquippedLoadoutArmorAndSubclass(loadout, storeId);
  const getModRenderKey = createGetModRenderKey();

  const [resolvedMods, modDefinitions] = useLoadoutMods(loadout, storeId);

  const [itemModAssignments, unassignedMods, upgradeCosts] = useMemo(() => {
    const { itemModAssignments, unassignedMods, upgradeCosts } = fitMostMods({
      defs,
      items: armor,
      plannedMods: modDefinitions,
      // assume everything is masterworked here -- fitMostMods will
      // ensure to use as few materials as possible
      armorEnergyRules: permissiveArmorEnergyRules,
    });

    return [itemModAssignments, unassignedMods, upgradeCosts];
  }, [armor, defs, modDefinitions]);

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
                    <EnergySwap item={item} assignedMods={itemModAssignments[item.id]} />
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
          {upgradeCosts.length > 0 && (
            <>
              <h3>{t('Loadouts.UpgradeCosts')}</h3>
              <div className={styles.costs}>
                {upgradeCosts.map((cost) => (
                  <div key={cost.materialHash}>
                    <Cost
                      className={styles.cost}
                      cost={{
                        itemHash: cost.materialHash,
                        quantity: cost.amount,
                        hasConditionalVisibility: false,
                      }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
          {unassignedMods.length > 0 && (
            <>
              <h3>{t('Loadouts.UnassignedMods')}</h3>
              <div className={styles.unassigned}>
                {unassignedMods.map((mod) => (
                  <PlugDef key={getModRenderKey(mod)} plug={mod} forClassType={loadout.classType} />
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
            lockedMods={resolvedMods}
            plugCategoryHashWhitelist={plugCategoryHashWhitelist}
            onAccept={onUpdateMods}
            onClose={() => setPlugCategoryHashWhitelist(undefined)}
          />
        </Portal>
      )}
    </>
  );
}
