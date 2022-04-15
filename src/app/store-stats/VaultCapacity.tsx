import PressTip from 'app/dim-ui/PressTip';
import { InventoryBucket, InventoryBuckets } from 'app/inventory/inventory-buckets';
import { bucketsSelector, currentStoreSelector, vaultSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { findItemsByBucket } from 'app/inventory/stores-helpers';
import {
  MaterialCountsTooltip,
  showMaterialCount,
} from 'app/material-counts/MaterialCountsWrappers';
import { useIsPhonePortrait } from 'app/shell/selectors';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import vaultIcon from 'destiny-icons/armor_types/helmet.svg';
import consumablesIcon from 'destiny-icons/general/consumables.svg';
import modificationsIcon from 'destiny-icons/general/modifications.svg';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import styles from './VaultCapacity.m.scss';

const bucketIcons = {
  3313201758: modificationsIcon,
  1469714392: consumablesIcon,
  138197802: vaultIcon,
};

const vaultBucketOrder = [
  // D1
  3003523923, // Armor
  4046403665, // Weapons
  138197802, // General

  // D2
  138197802,
  1469714392,
  3313201758,
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
function computeVaultCounts(activeStore: DimStore, vault: DimStore, buckets: InventoryBuckets) {
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
  computeVaultCounts
);

/** Current amounts and maximum capacities of the vault */
export default React.memo(function VaultCapacity() {
  const vaultCounts = useSelector(vaultCountsSelector);
  const mats = <MaterialCountsTooltip />;
  const isPhonePortrait = useIsPhonePortrait();

  return (
    <>
      {_.sortBy(Object.keys(vaultCounts), (id) => vaultBucketOrder.indexOf(parseInt(id, 10))).map(
        (bucketId) => {
          const { count, bucket } = vaultCounts[bucketId];
          const isConsumables = bucketId === String(BucketHashes.Consumables);
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
        }
      )}
    </>
  );
});
