import { settingSelector } from 'app/dim-api/selectors';
import { DimItem } from 'app/inventory/item-types';
import { makeFakeItem } from 'app/inventory/store/d2-item-factory';
import { useD2Definitions } from 'app/manifest/selectors';
import { percent } from 'app/shell/formatters';
import { chainComparator, compareBy } from 'app/utils/comparators';
import { VendorItemDisplay } from 'app/vendors/VendorItemComponent';
import clsx from 'clsx';
import _ from 'lodash';
import { useSelector } from 'react-redux';
import BungieImage from '../dim-ui/BungieImage';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import { AppIcon, collapseIcon, expandIcon } from '../shell/icons';
import { count } from '../utils/util';

const plugSetOrder = chainComparator<DimItem>(
  compareBy((i) => i.tier),
  compareBy((i) => i.name)
);

interface Props {
  buckets: InventoryBuckets;
  plugSetCollection: {
    hash: number;
    displayItem: number;
  };
  unlockedItems: Set<number>;
  path: number[];
  onNodePathSelected: (nodePath: number[]) => void;
}

/**
 * A single plug set.
 */
export default function PlugSet({
  buckets,
  plugSetCollection,
  unlockedItems,
  path,
  onNodePathSelected,
}: Props) {
  const defs = useD2Definitions()!;
  const plugSetHash = plugSetCollection.hash;
  const plugSetDef = defs.PlugSet.get(plugSetHash);
  const customTotalStatsByClass = useSelector(settingSelector('customTotalStatsByClass'));

  const plugSetItems = _.compact(
    plugSetDef.reusablePlugItems.map((i) =>
      makeFakeItem(defs, buckets, undefined, i.plugItemHash, customTotalStatsByClass)
    )
  );

  plugSetItems.sort(plugSetOrder);

  const acquired = count(plugSetItems, (i) => unlockedItems.has(i.hash));
  const childrenExpanded = path.includes(plugSetHash);
  const displayItem = defs.InventoryItem.get(plugSetCollection.displayItem);

  const title = (
    <span className="node-name">
      <BungieImage src={displayItem.displayProperties.icon} /> {displayItem.displayProperties.name}
    </span>
  );

  return (
    <div className="presentation-node">
      <div
        className={clsx('title', { collapsed: !childrenExpanded })}
        onClick={() => onNodePathSelected(childrenExpanded ? [] : [plugSetHash])}
      >
        <span className="collapse-handle">
          <AppIcon className="collapse-icon" icon={childrenExpanded ? collapseIcon : expandIcon} />{' '}
          {title}
        </span>
        <div className="node-progress">
          <div className="node-progress-count">
            {acquired} / {plugSetItems.length}
          </div>
          <div className="node-progress-bar">
            <div
              className="node-progress-bar-amount"
              style={{ width: percent(acquired / plugSetItems.length) }}
            />
          </div>
        </div>
      </div>
      {childrenExpanded && (
        <div className="collectibles plugset">
          {plugSetItems.map((item) => (
            <VendorItemDisplay
              key={item.index}
              item={item}
              unavailable={!unlockedItems.has(item.hash)}
              owned={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
