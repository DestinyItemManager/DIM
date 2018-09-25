import * as React from 'react';
import { DimStore, D1Store } from './store-types';
import CollapsibleTitle from '../dim-ui/CollapsibleTitle';
import D1Reputation from './D1Reputation';
import classNames from 'classnames';
import { t } from 'i18next';
import { Settings } from '../settings/reducer';

export default function D1ReputationSection({
  stores,
  collapsedSections
}: {
  stores: DimStore[];
  collapsedSections: Settings['collapsedSections'];
}) {
  return (
    <div className="section">
      <CollapsibleTitle
        title={t('Bucket.Reputation')}
        sectionId="Reputation"
        collapsedSections={collapsedSections}
      >
        <div className="store-row items reputation">
          {stores.map((store: D1Store) => (
            <div
              key={store.id}
              className={classNames('store-cell', {
                vault: store.isVault
              })}
            >
              <D1Reputation store={store} />
            </div>
          ))}
        </div>
      </CollapsibleTitle>
    </div>
  );
}
