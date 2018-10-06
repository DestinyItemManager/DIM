import { t } from 'i18next';
import * as React from 'react';
import { D2Item } from '../../../inventory/item-types';
import { LockType } from '../../types';
import ExcludableItem from './ExcludableItem';

export default function LockableItems({
  items,
  locked,
  toggleExcludeItem
}: {
  items: {
    [itemHash: number]: D2Item[];
  };
  locked?: LockType;
  toggleExcludeItem(excludedItem: D2Item): void;
}) {
  return (
    <>
      <div>{t('LoadoutBuilder.LockItemTitle')}</div>
      <div className="add-perk-options-content">
        {Object.values(items).map((instances: D2Item[]) =>
          instances.map((item) => (
            <ExcludableItem key={item.id} {...{ item, locked, onExclude: toggleExcludeItem }} />
          ))
        )}
      </div>
    </>
  );
}
