import * as React from 'react';
import BungieImage from '../../dim-ui/BungieImage';
import PressTip from '../../dim-ui/PressTip';
import { D2Item } from '../../inventory/item-types';
import LoadoutBuilderItem from '../LoadoutBuilderItem';
import { LockedItemType } from '../types';
import PlugTooltip from './PlugTooltip';
import { filterPlugs } from './utils';

export default function GeneratedSetItem({
  item,
  locked,
  onExclude
}: {
  item: D2Item;
  locked: LockedItemType[];
  onExclude(item: LockedItemType): void;
}) {
  return (
    <div className="generated-build-items">
      <LoadoutBuilderItem item={item} locked={locked} onExclude={onExclude} />
      {item!.sockets &&
        item!.sockets!.categories.length === 2 &&
        // TODO: look at plugs that we filtered on to see if they match selected perk or not.
        item!.sockets!.sockets.filter(filterPlugs).map((socket) => (
          <PressTip
            key={socket!.plug!.plugItem.hash}
            tooltip={<PlugTooltip item={item} socket={socket} />}
          >
            <div>
              <BungieImage
                className="item-mod"
                src={socket!.plug!.plugItem.displayProperties.icon}
              />
            </div>
          </PressTip>
        ))}
    </div>
  );
}
