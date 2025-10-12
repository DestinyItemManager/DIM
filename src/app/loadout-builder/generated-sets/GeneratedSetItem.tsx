import { EnergyIncrementsWithPresstip } from 'app/dim-ui/EnergyIncrements';
import { t } from 'app/i18next-t';
import PlugDef from 'app/loadout/loadout-ui/PlugDef';
import Sockets from 'app/loadout/loadout-ui/Sockets';
import { toggleSearchQueryComponent } from 'app/shell/actions';
import { AppIcon, pinIcon } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { getArmorArchetypeSocket } from 'app/utils/socket-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { BucketHashes, PlugCategoryHashes } from 'data/d2/generated-enums';
import { Dispatch } from 'react';
import { DimItem, PluggableInventoryItemDefinition } from '../../inventory/item-types';
import LoadoutBuilderItem from '../LoadoutBuilderItem';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { autoAssignmentPCHs } from '../types';
import * as styles from './GeneratedSetItem.m.scss';

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
  assignedMods,
  autoStatMods,
  automaticallyPickedMods,
  energy,
  lbDispatch,
}: {
  item: DimItem;
  pinned: boolean;
  assignedMods?: PluggableInventoryItemDefinition[];
  autoStatMods: boolean;
  automaticallyPickedMods?: number[];
  energy: { energyCapacity: number; energyUsed: number };
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}) {
  const pinItem = (item: DimItem) => lbDispatch({ type: 'pinItem', item });
  const unpinItem = () => lbDispatch({ type: 'unpinItem', item });
  const dispatch = useThunkDispatch();

  const onSocketClick = (
    plugDef: PluggableInventoryItemDefinition,
    plugCategoryHashWhitelist?: number[],
  ) => {
    const { plugCategoryHash } = plugDef.plug;

    if (plugCategoryHash === PlugCategoryHashes.Intrinsics) {
      // Legendary armor can have intrinsic perks and it might be
      // nice to provide a convenient user interface for those,
      // but the exotic picker is not the way to do it.
      if (item.isExotic && item.bucket.hash !== BucketHashes.ClassArmor) {
        lbDispatch({ type: 'lockExotic', lockedExoticHash: item.hash });
      } else {
        dispatch(toggleSearchQueryComponent(`exactperk:"${plugDef.displayProperties.name}"`));
      }
    } else if (
      !autoAssignmentPCHs.includes(plugCategoryHash) &&
      (!autoStatMods || plugCategoryHash !== PlugCategoryHashes.EnhancementsV2General)
    ) {
      lbDispatch({
        type: 'openModPicker',
        plugCategoryHashWhitelist,
      });
    }
  };

  const archetype = getArmorArchetypeSocket(item)?.plugged!.plugDef;

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
          {pinned ? (
            <button
              type="button"
              className={styles.swapButton}
              title={t('LoadoutBuilder.UnlockItem')}
              onClick={unpinItem}
            >
              <AppIcon icon={pinIcon} />
            </button>
          ) : (
            archetype && (
              <PlugDef
                className={styles.archetype}
                forClassType={DestinyClass.Unknown}
                plug={archetype}
              />
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
