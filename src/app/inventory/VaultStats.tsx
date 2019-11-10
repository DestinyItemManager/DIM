import React from 'react';
import { DimVault } from './store-types';
import clsx from 'clsx';
import BungieImage from 'app/dim-ui/BungieImage';
import _ from 'lodash';
import styles from './VaultStats.m.scss';
import modificationsIcon from 'destiny-icons/general/modifications.svg';
import shadersIcon from 'destiny-icons/general/shaders2.svg';
import consumablesIcon from 'destiny-icons/general/consumables.svg';
import vaultIcon from 'destiny-icons/armor_types/helmet.svg';

const bucketIcons = {
  3313201758: modificationsIcon,
  2973005342: shadersIcon,
  1469714392: consumablesIcon,
  138197802: vaultIcon
};
const vaultBucketOrder = [
  // D1
  'BUCKET_VAULT_WEAPONS',
  'BUCKET_VAULT_ARMOR',
  'BUCKET_VAULT_ITEMS',

  // D2
  '138197802',
  '1469714392',
  '3313201758',
  '2973005342'
];

export default function VaultStats({ store }: { store: DimVault }) {
  return (
    <div className={styles.vaultStats}>
      {store.currencies.map((currency) => (
        <React.Fragment key={currency.itemHash}>
          <BungieImage
            className={styles.currency}
            src={currency.displayProperties.icon}
            title={currency.displayProperties.name}
          />
          <div className={styles.currency} title={currency.displayProperties.name}>
            {currency.quantity.toLocaleString()}
          </div>
        </React.Fragment>
      ))}
      {_.times(4 - store.currencies.length, (i) => (
        <React.Fragment key={i}>
          <div />
          <div />
        </React.Fragment>
      ))}
      {_.sortBy(Object.keys(store.vaultCounts), (id) => vaultBucketOrder.indexOf(id)).map(
        (bucketId) => (
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
                  store.vaultCounts[bucketId].count === store.vaultCounts[bucketId].bucket.capacity
              })}
            >
              {store.vaultCounts[bucketId].count}/{store.vaultCounts[bucketId].bucket.capacity}
            </div>
          </React.Fragment>
        )
      )}
    </div>
  );
}
