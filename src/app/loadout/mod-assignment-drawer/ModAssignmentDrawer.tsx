import { EnergyIncrementsWithPresstip } from 'app/dim-ui/EnergyIncrements';
import Sheet from 'app/dim-ui/Sheet';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { permissiveArmorEnergyRules } from 'app/loadout-builder/types';
import { Loadout, ResolvedLoadoutItem } from 'app/loadout/loadout-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { LoadoutCharacterStats } from 'app/store-stats/CharacterStats';
import { compact } from 'app/utils/collections';
import Cost from 'app/vendors/Cost';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import { useCallback, useMemo, useState } from 'react';
import '../../inventory-page/StoreBucket.scss';
import PlugDef from '../loadout-ui/PlugDef';
import Sockets from '../loadout-ui/Sockets';
import { fitMostMods } from '../mod-assignment-utils';
import { createGetModRenderKey } from '../mod-utils';
import ModPicker from '../ModPicker';
import styles from './ModAssignmentDrawer.m.scss';
import { useEquippedLoadoutArmorAndSubclass, useLoadoutMods } from './selectors';

function Header({
  loadout,
  subclass,
  armor,
  mods,
}: {
  loadout: Loadout;
  subclass: ResolvedLoadoutItem | undefined;
  armor: DimItem[];
  mods: PluggableInventoryItemDefinition[];
}) {
  return (
    <div>
      <h1>{t('Loadouts.ModPlacement.ModPlacement')}</h1>
      <div className={styles.headerInfo}>
        <div className={styles.headerName}>{loadout.name}</div>
        <div className={styles.headerStats}>
          <LoadoutCharacterStats
            loadout={loadout}
            subclass={subclass}
            allMods={mods}
            items={armor}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * A sheet that shows what mods will go where on a loadout, given its current
 * state, and what energy upgrades need to be done to make those mods fit.
 */
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

  const { itemModAssignments, resultingItemEnergies, unassignedMods, invalidMods, upgradeCosts } =
    useMemo(
      () =>
        fitMostMods({
          defs,
          items: armor,
          plannedMods: modDefinitions,
          // assume everything is masterworked here -- fitMostMods will
          // ensure to use as few materials as possible
          armorEnergyRules: permissiveArmorEnergyRules,
        }),
      [armor, defs, modDefinitions],
    );

  const onSocketClick = useCallback(
    (plugDef: PluggableInventoryItemDefinition, plugCategoryHashWhitelist: number[]) => {
      const { plugCategoryHash } = plugDef.plug;

      if (plugCategoryHash === PlugCategoryHashes.Intrinsics) {
        // Do nothing, it's an exotic plug
      } else {
        setPlugCategoryHashWhitelist(plugCategoryHashWhitelist);
      }
    },
    [],
  );

  const flatAssigned = compact(Object.values(itemModAssignments).flat());

  if (!defs) {
    return null;
  }

  // TODO: button to apply mods
  // TODO: consider existing mods in assignment
  return (
    <>
      <Sheet
        header={<Header loadout={loadout} subclass={subclass} armor={armor} mods={flatAssigned} />}
        disabled={Boolean(onUpdateMods && plugCategoryHashWhitelist)}
        onClose={onClose}
      >
        <div className={styles.container}>
          <div className={styles.assigned}>
            {armor.map((item) => {
              const energy = resultingItemEnergies[item.id];
              return (
                <div key={item.id} className={styles.itemAndMods}>
                  <div>
                    <ConnectedInventoryItem item={item} />
                    {energy && (
                      <EnergyIncrementsWithPresstip
                        energy={energy}
                        wrapperClass={styles.energyMeter}
                        item={item}
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
          {upgradeCosts.length > 0 && (
            <>
              <div className={styles.infoSectionHeader}>
                <h3>{t('Loadouts.ModPlacement.UpgradeCosts')}</h3>
                <span>{t('Loadouts.ModPlacement.UpgradeCostsDesc')}</span>
              </div>
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
              <div className={styles.infoSectionHeader}>
                <h3>{t('Loadouts.ModPlacement.UnassignedMods')}</h3>
                <span>
                  {t('Loadouts.ModPlacement.UnassignedModsDesc', { count: unassignedMods.length })}
                </span>
              </div>
              <div className={styles.unassigned}>
                {unassignedMods.map((mod) => (
                  <PlugDef key={getModRenderKey(mod)} plug={mod} forClassType={loadout.classType} />
                ))}
              </div>
            </>
          )}
          {invalidMods.length > 0 && (
            <>
              <div className={styles.infoSectionHeader}>
                <h3>{t('Loadouts.ModPlacement.InvalidMods')}</h3>
                <span>
                  {t('Loadouts.ModPlacement.InvalidModsDesc', { count: invalidMods.length })}
                </span>
              </div>
              <div className={styles.unassigned}>
                {invalidMods.map((mod) => (
                  <PlugDef key={getModRenderKey(mod)} plug={mod} forClassType={loadout.classType} />
                ))}
              </div>
            </>
          )}
        </div>
      </Sheet>
      {onUpdateMods && plugCategoryHashWhitelist && (
        <ModPicker
          classType={loadout.classType}
          owner={storeId}
          lockedMods={resolvedMods}
          plugCategoryHashWhitelist={plugCategoryHashWhitelist}
          onAccept={onUpdateMods}
          onClose={() => setPlugCategoryHashWhitelist(undefined)}
        />
      )}
    </>
  );
}
