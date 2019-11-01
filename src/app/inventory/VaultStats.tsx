import React from 'react';
import { DimVault } from './store-types';
import PressTip from 'app/dim-ui/PressTip';
import clsx from 'clsx';
import { InventoryBucket } from './inventory-buckets';
import BungieImage from 'app/dim-ui/BungieImage';
import _ from 'lodash';
import styles from './VaultStats.m.scss';
import modificationsIcon from 'destiny-icons/general/modifications.svg';
import shadersIcon from 'destiny-icons/general/shaders.svg';
import consumablesIcon from 'destiny-icons/general/consumables.svg';
import vaultIcon from 'destiny-icons/armor_types/helmet.svg';

const bucketIcons = {
  3313201758: modificationsIcon,
  2973005342: shadersIcon,
  1469714392: consumablesIcon,
  138197802: vaultIcon
};

export default function VaultStats({ store }: { store: DimVault }) {
  return (
    <div className={styles.vaultStats}>
      {store.currencies.map((currency) => (
        <div
          key={currency.itemHash}
          title={currency.displayProperties.name}
          className={styles.currency}
        >
          <BungieImage src={currency.displayProperties.icon} />
          <div>{currency.quantity.toLocaleString()}</div>
        </div>
      ))}
      {_.times(4 - store.currencies.length, (i) => (
        <React.Fragment key={i}>
          <div />
          <div />
        </React.Fragment>
      ))}
      {Object.keys(store.vaultCounts).map((bucketId) => (
        <div
          key={bucketId}
          className={clsx(styles.bucket, {
            [styles.full]:
              store.vaultCounts[bucketId].count === store.vaultCounts[bucketId].bucket.capacity
          })}
        >
          <div className={styles.bucketTag}>
            {bucketIcons[bucketId] ? (
              <img src={bucketIcons[bucketId]} />
            ) : (
              store.vaultCounts[bucketId].bucket.name.substring(0, 1)
            )}
          </div>
          <PressTip key={bucketId} tooltip={<VaultToolTip counts={store.vaultCounts[bucketId]} />}>
            <div>
              {store.vaultCounts[bucketId].count}/{store.vaultCounts[bucketId].bucket.capacity}
            </div>
          </PressTip>
        </div>
      ))}
    </div>
  );
}

function VaultToolTip({ counts }: { counts: { bucket: InventoryBucket; count: number } }) {
  return (
    <div>
      <h2>{counts.bucket.name}</h2>
      {counts.count}/{counts.bucket.capacity}
    </div>
  );
}
