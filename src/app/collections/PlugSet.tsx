import { DestinyItemPlug } from 'bungie-api-ts/destiny2';
import * as React from 'react';
import * as _ from 'lodash';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import './collections.scss';
import { VendorItem } from '../d2-vendors/vendor-item';
import VendorItemComponent from '../d2-vendors/VendorItemComponent';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import { count } from '../util';
import BungieImage from '../dim-ui/BungieImage';
import { AppIcon, expandIcon, collapseIcon } from '../shell/icons';
import { percent } from '../inventory/dimPercentWidth.directive';

interface Props {
  defs: D2ManifestDefinitions;
  buckets: InventoryBuckets;
  plugSetHash: number;
  items: DestinyItemPlug[];
  path: number[];
  onNodePathSelected(nodePath: number[]);
}

/**
 * A single plug set.
 */
export default class PlugSet extends React.Component<Props> {
  render() {
    const { defs, buckets, plugSetHash, items, path, onNodePathSelected } = this.props;

    const plugSetDef = defs.PlugSet.get(plugSetHash);

    const vendorItems = plugSetDef.reusablePlugItems.map((i) =>
      VendorItem.forPlugSetItem(
        defs,
        buckets,
        i,
        items.some((k) => k.plugItemHash === i.plugItemHash && k.enabled)
      )
    );

    const acquired = count(vendorItems, (i) => i.canPurchase);
    const childrenExpanded = path.includes(plugSetHash);

    const title = (
      <span className="node-name">
        <BungieImage src={defs.InventoryItem.get(3960522253).displayProperties.icon} />{' '}
        {plugSetDef.displayProperties.name}
      </span>
    );

    return (
      <div className="presentation-node">
        <div className="title">
          <span
            className="collapse-handle"
            onClick={() => onNodePathSelected(childrenExpanded ? [] : [plugSetHash])}
          >
            <AppIcon className="collapse" icon={childrenExpanded ? collapseIcon : expandIcon} />{' '}
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
          <div className="collectibles">
            {_.sortBy(vendorItems, (i) => i.displayProperties.name).map((item) => (
              <VendorItemComponent key={item.key} defs={defs} item={item} owned={false} />
            ))}
          </div>
        )}
      </div>
    );
  }
}
