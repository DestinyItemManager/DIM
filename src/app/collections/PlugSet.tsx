import { DestinyItemPlug } from 'bungie-api-ts/destiny2';
import React from 'react';
import _ from 'lodash';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import './collections.scss';
import { VendorItem } from '../vendors/vendor-item';
import VendorItemComponent from '../vendors/VendorItemComponent';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import { count } from '../utils/util';
import BungieImage from '../dim-ui/BungieImage';
import { AppIcon, expandIcon, collapseIcon } from '../shell/icons';
import { percent } from '../shell/filters';
import clsx from 'clsx';
import { chainComparator, compareBy } from 'app/utils/comparators';

const plugSetOrder = chainComparator<VendorItem>(
  compareBy((i) => i.item?.tier),
  compareBy((i) => i.item?.name)
);

interface Props {
  defs: D2ManifestDefinitions;
  buckets: InventoryBuckets;
  plugSetCollection: {
    hash: number;
    displayItem: number;
  };
  items: DestinyItemPlug[];
  path: number[];
  onNodePathSelected(nodePath: number[]);
}

/**
 * A single plug set.
 */
export default function PlugSet({
  defs,
  buckets,
  plugSetCollection,
  items,
  path,
  onNodePathSelected
}: Props) {
  const plugSetHash = plugSetCollection.hash;
  const plugSetDef = defs.PlugSet.get(plugSetHash);

  const vendorItems = plugSetDef.reusablePlugItems.map((i) =>
    VendorItem.forPlugSetItem(
      defs,
      buckets,
      i,
      items.some((k) => k.plugItemHash === i.plugItemHash && k.enabled)
    )
  );

  vendorItems.sort(plugSetOrder);

  const acquired = count(vendorItems, (i) => i.canPurchase);
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
            {acquired} / {vendorItems.length}
          </div>
          <div className="node-progress-bar">
            <div
              className="node-progress-bar-amount"
              style={{ width: percent(acquired / vendorItems.length) }}
            />
          </div>
        </div>
      </div>
      {childrenExpanded && (
        <div className="collectibles plugset">
          {vendorItems.map((item) => (
            <VendorItemComponent key={item.key} defs={defs} item={item} owned={false} />
          ))}
        </div>
      )}
    </div>
  );
}
