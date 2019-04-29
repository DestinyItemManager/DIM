import { t } from 'app/i18next-t';
import React from 'react';
import { D2Item } from '../../../inventory/item-types';
import { LockedItemType } from '../../types';
import LoadoutBuilderItem from '../../LoadoutBuilderItem';

export default function LockableItems({
  items,
  locked,
  toggleExcludeItem
}: {
  items: Readonly<{ [itemHash: number]: readonly D2Item[] }>;
  locked?: readonly LockedItemType[];
  toggleExcludeItem(excludedItem: LockedItemType): void;
}) {
  /* TODO: just use the item picker */
  return (
    <>
      <div>{t('LoadoutBuilder.LockItemTitle')}</div>
      <div className="add-perk-options-content">
        {Object.values(items).map((instances: D2Item[]) =>
          instances.map((item) => (
            <LoadoutBuilderItem
              key={item.id}
              item={item}
              locked={locked}
              onExclude={toggleExcludeItem}
            />
          ))
        )}
      </div>
    </>
  );
}
