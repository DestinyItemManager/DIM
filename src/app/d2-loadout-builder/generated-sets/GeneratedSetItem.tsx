import * as React from 'react';
import { D2Item } from '../../inventory/item-types';
import { filterPlugs } from './utils';
import PressTip from '../../dim-ui/PressTip';
import PlugTooltip from './PlugTooltip';
import BungieImage from '../../dim-ui/BungieImage';
import ConnectedInventoryItem from '../../inventory/ConnectedInventoryItem';
import DraggableInventoryItem from '../../inventory/DraggableInventoryItem';
import ItemPopupTrigger from '../../inventory/ItemPopupTrigger';

export default function GeneratedSetItem({ item }: { item: D2Item }) {
  return (
    <div className="generated-build-items">
      <DraggableInventoryItem item={item}>
        <ItemPopupTrigger item={item}>
          <ConnectedInventoryItem item={item} />
        </ItemPopupTrigger>
      </DraggableInventoryItem>
      {item!.sockets &&
        item!.sockets!.categories.length === 2 &&
        // TODO: look at plugs that we filtered on to see if they match selected perk or not.
        item!.sockets!.categories[0].sockets.filter(filterPlugs).map((socket) => (
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
