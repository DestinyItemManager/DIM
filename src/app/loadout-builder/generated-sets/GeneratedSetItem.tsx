import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage from 'app/dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import { showItemPicker } from 'app/item-picker/item-picker';
import { useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, faRandom, lockIcon } from 'app/shell/icons';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { Dispatch } from 'react';
import { DimItem, PluggableInventoryItemDefinition } from '../../inventory/item-types';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import LoadoutBuilderItem from '../LoadoutBuilderItem';
import { LockedItemType } from '../types';
import styles from './GeneratedSetItem.m.scss';
import Sockets from './Sockets';

function EnergySwap({
  defs,
  item,
  lockedMods,
}: {
  defs: D2ManifestDefinitions;
  item: DimItem;
  lockedMods: PluggableInventoryItemDefinition[];
}) {
  if (!lockedMods?.length) {
    return null;
  }

  const modCost = _.sumBy(lockedMods, (mod) => mod.plug.energyCost?.energyCost || 0);
  const itemEnergyCapacity = item.energy?.energyCapacity || 0;
  const armorEnergy = defs.EnergyType.get(item.energy!.energyTypeHash);
  const modEnergyHash = lockedMods.find(
    (mod) => mod.plug.energyCost?.energyType !== DestinyEnergyType.Any
  )?.plug.energyCost?.energyTypeHash;
  const modEnergy = (modEnergyHash && defs.EnergyType.get(modEnergyHash)) || null;
  const resultingEnergyCapacity =
    modEnergy && armorEnergy.hash === modEnergy.hash
      ? Math.max(itemEnergyCapacity, modCost)
      : modCost;

  return (
    modEnergy && (
      <div className={styles.energySwapContainer}>
        <div className={styles.energyValue}>
          <div className={clsx({ [styles.masterworked]: itemEnergyCapacity === 10 })}>
            {itemEnergyCapacity}
          </div>
          <BungieImage className={styles.energyIcon} src={armorEnergy.displayProperties.icon} />
        </div>
        <div className={styles.arrow}>{'➜'}</div>
        <div className={styles.energyValue}>
          <div className={clsx({ [styles.masterworked]: resultingEnergyCapacity === 10 })}>
            {resultingEnergyCapacity}
          </div>
          <BungieImage className={styles.energyIcon} src={modEnergy.displayProperties.icon} />
        </div>
      </div>
    )
  );
}

/**
 * An individual item in a generated set. Includes a perk display and a button for selecting
 * alternative items with the same stat mix.
 */
export default function GeneratedSetItem({
  item,
  locked,
  itemOptions,
  lockedMods,
  lbDispatch,
}: {
  item: DimItem;
  locked?: readonly LockedItemType[];
  itemOptions: DimItem[];
  lockedMods: PluggableInventoryItemDefinition[];
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}) {
  const defs = useD2Definitions()!;
  const addLockedItem = (item: LockedItemType) => lbDispatch({ type: 'addItemToLockedMap', item });
  const removeLockedItem = (item: LockedItemType) =>
    lbDispatch({ type: 'removeItemFromLockedMap', item });

  const chooseReplacement = async () => {
    const ids = new Set(itemOptions.map((i) => i.id));

    try {
      const { item } = await showItemPicker({
        prompt: t('LoadoutBuilder.ChooseAlternate'),
        filterItems: (item: DimItem) => ids.has(item.id),
      });

      addLockedItem({ type: 'item', item, bucket: item.bucket });
    } catch (e) {}
  };

  const onSocketClick = (
    plugDef: PluggableInventoryItemDefinition,
    plugCategoryHashWhitelist?: number[]
  ) => {
    const { plugCategoryHash } = plugDef.plug;

    if (plugCategoryHash === PlugCategoryHashes.Intrinsics) {
      const def = defs.InventoryItem.get(item.hash);
      lbDispatch({ type: 'lockExotic', lockedExotic: { def, bucketHash: item.bucket.hash } });
    } else {
      lbDispatch({
        type: 'openModPicker',
        initialQuery:
          plugCategoryHashWhitelist &&
          `plugCategoryHash:in:${JSON.stringify(plugCategoryHashWhitelist)}`,
      });
    }
  };

  return (
    <div>
      <EnergySwap defs={defs} item={item} lockedMods={lockedMods} />
      <div className={styles.item}>
        <div className={styles.swapButtonContainer}>
          <LoadoutBuilderItem item={item} locked={locked} addLockedItem={addLockedItem} />
          {itemOptions.length > 1 ? (
            <button
              type="button"
              className={styles.swapButton}
              title={t('LoadoutBuilder.ChooseAlternateTitle')}
              onClick={chooseReplacement}
            >
              <AppIcon icon={faRandom} />
            </button>
          ) : (
            locked?.some((li) => li.type === 'item') && (
              <button
                type="button"
                className={styles.swapButton}
                title={t('LoadoutBuilder.UnlockItem')}
                onClick={() => removeLockedItem({ type: 'item', item, bucket: item.bucket })}
              >
                <AppIcon icon={lockIcon} />
              </button>
            )
          )}
        </div>
        <div className={styles.lockedSockets}>
          <Sockets item={item} lockedMods={lockedMods} onSocketClick={onSocketClick} />
        </div>
      </div>
    </div>
  );
}
