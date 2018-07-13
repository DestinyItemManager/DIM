import * as React from 'react';
import { DimItem } from './item-types';
import { Settings } from '../settings/settings';
import classNames from 'classnames';
import { sortItems } from '../shell/dimAngularFilters.filter';
import './dimStoreBucket.scss';
import InventoryItem from './InventoryItem';

interface Props {
  items: DimItem[];
  settings: Readonly<Settings>;
}

export default class StoreBucket extends React.Component<Props> {
  render() {
    // TODO: General drag-drop stuff
    const { items, settings } = this.props;

    const empty = !items.length;
    const equippedItem = items.find((i) => i.equipped);
    const unequippedItems = sortItems(items.filter((i) => !i.equipped), settings);

    return (
      <div
        className={classNames("sub-section", { empty })}
      >
        {equippedItem &&
          <div className="equipped sub-bucket">
            <InventoryItem item={equippedItem} />
          </div>}
        <div className="unequipped sub-bucket">
          {unequippedItems.map((item) =>
            <InventoryItem key={item.index} item={item} />
          )}
        </div>
      </div>
    );
  }
}
