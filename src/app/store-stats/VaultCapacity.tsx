import { PressTip } from 'app/dim-ui/PressTip';
import { InventoryBucket, InventoryBuckets } from 'app/inventory/inventory-buckets';
import { bucketsSelector, currentStoreSelector, vaultSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { findItemsByBucket } from 'app/inventory/stores-helpers';
import {
  MaterialCountsTooltip,
  showMaterialCount,
} from 'app/material-counts/MaterialCountsWrappers';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { compareByIndex } from 'app/utils/comparators';
import { emptyObject } from 'app/utils/empty';
import { LookupTable } from 'app/utils/util-types';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import vaultIcon from 'destiny-icons/armor_types/helmet.svg';
import consumablesIcon from 'destiny-icons/general/consumables.svg';
import modificationsIcon from 'destiny-icons/general/modifications.svg';
import React, { memo } from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import styles from './VaultCapacity.m.scss';

const bucketIcons: LookupTable<BucketHashes, string> = {
  [BucketHashes.Modifications]: modificationsIcon,
  [BucketHashes.Consumables]: consumablesIcon,
  [BucketHashes.General]: vaultIcon,
};

const vaultBucketOrder = [
  // D1
  3003523923, // Armor
  4046403665, // Weapons

  // D2
  BucketHashes.General,
  BucketHashes.Consumables,
  BucketHashes.Modifications,
];

/** How many items are in each vault bucket. DIM hides the vault bucket concept from users but needs the count to track progress. */
interface VaultCounts {
  [bucketHash: string]: { count: number; bucket: InventoryBucket };
}

/**
 * DIM represents items in the vault different from how they actually are - we separate them by inventory bucket as if
 * the vault were a character, when really they're just big undifferentiated buckets. This re-calculates how full those
 * buckets are, for display. We could calculate this straight from the profile, but we want to be able to recompute it
 * when items move without reloading the profile.
 */
function computeVaultCounts(
  activeStore: DimStore | undefined,
  vault: DimStore | undefined,
  buckets: InventoryBuckets | undefined,
) {
  if (!activeStore || !vault || !buckets) {
    return emptyObject<VaultCounts>();
  }

  const vaultCounts: VaultCounts = {};

  for (const bucket of Object.values(buckets.byHash)) {
    // If this bucket can have items placed in the vault, count up how many of
    // that type are in the vault.
    if (bucket.vaultBucket) {
      // D2 has "account wide" buckets that are shared between characters but are
      // not the vault, and the items in them can *also* be vaulted. We represent
      // these as being owned by the "current character", and we consider them a
      // separate type of "vault" for the purposes of vault counts.
      if (bucket.accountWide) {
        const vaultBucketId = bucket.hash;
        vaultCounts[vaultBucketId] ??= {
          count: 0,
          bucket,
        };
        vaultCounts[vaultBucketId].count += findItemsByBucket(activeStore, bucket.hash).length;
      }

      const vaultBucketId = bucket.vaultBucket.hash;
      vaultCounts[vaultBucketId] ??= {
        count: 0,
        bucket: bucket.accountWide ? bucket : bucket.vaultBucket,
      };
      vaultCounts[vaultBucketId].count += findItemsByBucket(vault, bucket.hash).length;
    }
  }

  return vaultCounts;
}

const vaultCountsSelector = createSelector(
  currentStoreSelector,
  vaultSelector,
  bucketsSelector,
  computeVaultCounts,
);

/** Current amounts and maximum capacities of the vault */
export default memo(function VaultCapacity() {
  const vaultCounts = useSelector(vaultCountsSelector);
  const mats = <MaterialCountsTooltip />;
  const isPhonePortrait = useIsPhonePortrait();

  return (
    <>
      {Object.keys(vaultCounts)
        .sort(compareByIndex(vaultBucketOrder, (id) => parseInt(id, 10)))
        .map((bucketIdStr) => {
          const bucketId = parseInt(bucketIdStr, 10) as BucketHashes;
          const { count, bucket } = vaultCounts[bucketId];
          const isConsumables = bucketId === BucketHashes.Consumables;
          const title = isConsumables ? undefined : bucket.name;
          return (
            <React.Fragment key={bucketId}>
              <div className={styles.bucketTag} title={title}>
                {bucketIcons[bucketId] ? (
                  <img src={bucketIcons[bucketId]} alt="" />
                ) : (
                  bucket.name.substring(0, 1)
                )}
              </div>
              <PressTip
                tooltip={isConsumables && !isPhonePortrait ? mats : undefined}
                placement="bottom"
                wide
              >
                <div
                  title={title}
                  className={clsx({
                    [styles.full]: count === bucket.capacity,
                  })}
                  onClick={isConsumables ? showMaterialCount : undefined}
                >
                  {count}/{bucket.capacity}
                </div>
              </PressTip>
            </React.Fragment>
          );
        })}
    </>
  );
});
