import { EnergyIncrementsWithPresstip } from 'app/dim-ui/EnergyIncrements';
import { t } from 'app/i18next-t';
import { useItemPicker } from 'app/item-picker/item-picker';
import Sockets from 'app/loadout/loadout-ui/Sockets';
import { AppIcon, faRandom, lockIcon } from 'app/shell/icons';
import clsx from 'clsx';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import { Dispatch } from 'react';
import { DimItem, PluggableInventoryItemDefinition } from '../../inventory/item-types';
import LoadoutBuilderItem from '../LoadoutBuilderItem';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import styles from './GeneratedSetItem.m.scss';

/**
 * Shows how we recommend the energy of this armor be changed in order to fit its mods.
 */
export function EnergySwap({ energy }: { energy: { energyCapacity: number; energyUsed: number } }) {
  const armorEnergyCapacity = energy.energyCapacity;
  const resultingEnergyCapacity = Math.max(energy.energyUsed, armorEnergyCapacity);

  const noEnergyChange = resultingEnergyCapacity === armorEnergyCapacity;

  return (
    <div className={clsx(styles.energySwapContainer, { [styles.energyHidden]: noEnergyChange })}>
      <div className={styles.energyValue}>{armorEnergyCapacity}</div>
      <div className={styles.arrow}>➜</div>
      <div className={styles.energyValue}>{resultingEnergyCapacity}</div>
    </div>
  );
}

/**
 * An individual item in a generated set. Includes a perk display and a button for selecting
 * alternative items with the same stat mix.
 */
export default function GeneratedSetItem({
  item,
  pinned,
  itemOptions,
  assignedMods,
  autoStatMods,
  automaticallyPickedMods,
  energy,
  lbDispatch,
}: {
  item: DimItem;
  pinned: boolean;
  itemOptions: DimItem[];
  assignedMods?: PluggableInventoryItemDefinition[];
  autoStatMods: boolean;
  automaticallyPickedMods?: number[];
  energy: { energyCapacity: number; energyUsed: number };
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}) {
  const pinItem = (item: DimItem) => lbDispatch({ type: 'pinItem', item });
  const unpinItem = () => lbDispatch({ type: 'unpinItem', item });
  const showItemPicker = useItemPicker();

  const chooseReplacement = async () => {
    const ids = new Set(itemOptions.map((i) => i.id));

    const item = await showItemPicker({
      prompt: t('LoadoutBuilder.ChooseAlternateTitle'),
      filterItems: (item: DimItem) => ids.has(item.id),
    });

    if (item) {
      pinItem(item);
    }
  };

  const onSocketClick = (
    plugDef: PluggableInventoryItemDefinition,
    plugCategoryHashWhitelist?: number[],
  ) => {
    const { plugCategoryHash } = plugDef.plug;

    if (plugCategoryHash === PlugCategoryHashes.Intrinsics) {
      // Legendary armor can have intrinsic perks and it might be
      // nice to provide a convenient user interface for those,
      // but the exotic picker is not the way to do it.
      if (item.isExotic) {
        lbDispatch({ type: 'lockExotic', lockedExoticHash: item.hash });
      }
    } else if (
      plugCategoryHash !== PlugCategoryHashes.EnhancementsArtifice &&
      (!autoStatMods || plugCategoryHash !== PlugCategoryHashes.EnhancementsV2General)
    ) {
      lbDispatch({
        type: 'openModPicker',
        plugCategoryHashWhitelist,
      });
    }
  };

  return (
    <div>
      <div className={styles.item}>
        <div className={styles.swapButtonContainer}>
          <LoadoutBuilderItem item={item} onShiftClick={() => pinItem(item)} />
          <EnergyIncrementsWithPresstip
            wrapperClass={styles.energyMeter}
            energy={energy}
            item={item}
          />
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
            pinned && (
              <button
                type="button"
                className={styles.swapButton}
                title={t('LoadoutBuilder.UnlockItem')}
                onClick={unpinItem}
              >
                <AppIcon icon={lockIcon} />
              </button>
            )
          )}
        </div>
        <Sockets
          item={item}
          lockedMods={assignedMods}
          automaticallyPickedMods={automaticallyPickedMods}
          onSocketClick={onSocketClick}
          size="small"
        />
      </div>
    </div>
  );
}
