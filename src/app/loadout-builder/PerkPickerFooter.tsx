import React from 'react';
import { t } from 'app/i18next-t';

import styles from './PickerFooter.m.scss';
import ArmorBucketIcon from './ArmorBucketIcon';
import { SocketDetailsMod } from 'app/item-popup/SocketDetails';
import BungieImageAndAmmo from 'app/dim-ui/BungieImageAndAmmo';
import GlobalHotkeys from 'app/hotkeys/GlobalHotkeys';
import { LockedMap, LockedItemType } from './types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { InventoryBucket, InventoryBuckets } from 'app/inventory/inventory-buckets';

interface Props {
  defs: D2ManifestDefinitions;
  bucketOrder: number[];
  buckets: InventoryBuckets;
  isPhonePortrait: boolean;
  selectedPerks: LockedMap;
  onSubmit(event: React.FormEvent | KeyboardEvent): void;
  onPerkSelected(item: LockedItemType, bucket: InventoryBucket): void;
}

function PickerFooter(props: Props) {
  const {
    defs,
    isPhonePortrait,
    bucketOrder,
    buckets,
    selectedPerks,
    onSubmit,
    onPerkSelected
  } = props;

  return (
    <div className={styles.footer}>
      <div>
        <button className={styles.submitButton} onClick={onSubmit}>
          {!isPhonePortrait && '⏎ '}
          {t('LoadoutBuilder.SelectPerks')}
        </button>
      </div>
      <div className={styles.selectedPerks}>
        {bucketOrder.map(
          (bucketHash) =>
            selectedPerks[bucketHash] && (
              <React.Fragment key={bucketHash}>
                <ArmorBucketIcon bucket={buckets.byHash[bucketHash]} className={styles.armorIcon} />
                {selectedPerks[bucketHash]!.map((lockedItem) => (
                  <LockedItemIcon
                    key={
                      (lockedItem.type === 'mod' && lockedItem.mod.hash) ||
                      (lockedItem.type === 'perk' && lockedItem.perk.hash) ||
                      (lockedItem.type === 'burn' && lockedItem.burn.dmg) ||
                      'unknown'
                    }
                    defs={defs}
                    lockedItem={lockedItem}
                    onClick={() => {
                      if (lockedItem.bucket) {
                        onPerkSelected(lockedItem, lockedItem.bucket);
                      }
                    }}
                  />
                ))}
              </React.Fragment>
            )
        )}
        <GlobalHotkeys
          hotkeys={[
            {
              combo: 'enter',
              description: t('LoadoutBuilder.SelectPerks'),
              callback: onSubmit
            }
          ]}
        />
      </div>
    </div>
  );
}

function LockedItemIcon({
  lockedItem,
  defs,
  onClick
}: {
  lockedItem: LockedItemType;
  defs: D2ManifestDefinitions;
  onClick(e: React.MouseEvent): void;
}) {
  switch (lockedItem.type) {
    case 'mod':
      return (
        <SocketDetailsMod itemDef={lockedItem.mod} defs={defs} className={styles.selectedPerk} />
      );
    case 'perk':
      return (
        <BungieImageAndAmmo
          onClick={onClick}
          className={styles.selectedPerk}
          hash={lockedItem.perk.hash}
          title={lockedItem.perk.displayProperties.name}
          src={lockedItem.perk.displayProperties.icon}
        />
      );
    case 'burn':
      return (
        <div
          className={styles.selectedPerk}
          title={lockedItem.burn.displayProperties.name}
          onClick={onClick}
        >
          <img src={lockedItem.burn.displayProperties.icon} />
        </div>
      );
  }

  return null;
}

export default PickerFooter;
