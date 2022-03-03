import { t } from 'app/i18next-t';
import { D1Store, DimStore } from 'app/inventory/store-types';
import clsx from 'clsx';
import React from 'react';
import CollapsibleTitle from '../dim-ui/CollapsibleTitle';
import D1Reputation from './D1Reputation';

export default function D1ReputationSection({ stores }: { stores: DimStore[] }) {
  return (
    <CollapsibleTitle title={t('Bucket.Reputation')} sectionId="Reputation">
      <div className="store-row items reputation">
        {stores.map((store: D1Store) => (
          <div
            key={store.id}
            className={clsx('store-cell', {
              vault: store.isVault,
            })}
          >
            <D1Reputation store={store} />
          </div>
        ))}
      </div>
    </CollapsibleTitle>
  );
}
