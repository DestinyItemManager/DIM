import React from 'react';
import { DimVault } from './store-types';
import PressTip from 'app/dim-ui/PressTip';
import clsx from 'clsx';
import { InventoryBucket } from './inventory-buckets';
import BungieImage from 'app/dim-ui/BungieImage';
import { numberFormatter } from 'app/utils/util';
import { settings } from 'app/settings/settings';

export default function VaultStats({ store }: { store: DimVault }) {
  return (
    <div className="vault-stats">
      <div className="currencies">
        {store.currencies.map((currency) => (
          <div key={currency.itemHash} title={currency.displayProperties.name} className="currency">
            <BungieImage src={currency.displayProperties.icon} />
            {numberFormatter(settings.language).format(currency.quantity)}
          </div>
        ))}
      </div>
      <div className="vault-capacity">
        {Object.keys(store.vaultCounts).map((bucketId) => (
          <PressTip key={bucketId} tooltip={<VaultToolTip counts={store.vaultCounts[bucketId]} />}>
            <div
              key={bucketId}
              className={clsx('vault-bucket', {
                'vault-bucket-full':
                  store.vaultCounts[bucketId].count === store.vaultCounts[bucketId].bucket.capacity
              })}
            >
              <div className="vault-bucket-tag">
                {store.vaultCounts[bucketId].bucket.name.substring(0, 1)}
              </div>
              {store.vaultCounts[bucketId].count}/{store.vaultCounts[bucketId].bucket.capacity}
            </div>
          </PressTip>
        ))}
      </div>
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
