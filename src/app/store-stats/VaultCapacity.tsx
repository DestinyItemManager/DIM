import React from 'react';
import clsx from 'clsx';
import _ from 'lodash';
import type { DimVault } from 'app/inventory/store-types';
import modificationsIcon from 'destiny-icons/general/modifications.svg';
import shadersIcon from 'destiny-icons/general/shaders2.svg';
import consumablesIcon from 'destiny-icons/general/consumables.svg';
import vaultIcon from 'destiny-icons/armor_types/helmet.svg';
import styles from './VaultCapacity.m.scss';

const bucketIcons = {
  3313201758: modificationsIcon,
  2973005342: shadersIcon,
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
  2973005342,
];

/** Current amounts and maximum capacities of the vault */
export default function VaultCapacity({ store }: { store: DimVault }) {
  return (
    <>
      {_.sortBy(Object.keys(store.vaultCounts), (id) =>
        vaultBucketOrder.indexOf(parseInt(id, 10))
      ).map((bucketId) => (
        <React.Fragment key={bucketId}>
          <div className={styles.bucketTag} title={store.vaultCounts[bucketId].bucket.name}>
            {bucketIcons[bucketId] ? (
              <img src={bucketIcons[bucketId]} alt="" />
            ) : (
              store.vaultCounts[bucketId].bucket.name.substring(0, 1)
            )}
          </div>
          <div
            title={store.vaultCounts[bucketId].bucket.name}
            className={clsx({
              [styles.full]:
                store.vaultCounts[bucketId].count === store.vaultCounts[bucketId].bucket.capacity,
            })}
          >
            {store.vaultCounts[bucketId].count}/{store.vaultCounts[bucketId].bucket.capacity}
          </div>
        </React.Fragment>
      ))}
    </>
  );
}
