import classNames from 'classnames';
import React from 'react';
import PressTip from '../dim-ui/PressTip';
import './ItemSockets.scss';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { D2Item, DimSocket, DimPlug } from '../inventory/item-types';
import { InventoryCuratedRoll } from '../curated-rolls/curatedRollService';
import BungieImageAndAmmo from '../dim-ui/BungieImageAndAmmo';
import BestRatedIcon from './BestRatedIcon';
import PlugTooltip from './PlugTooltip';

export default function Plug({
  defs,
  plug,
  item,
  socketInfo,
  curationEnabled,
  inventoryCuratedRoll,
  className,
  bestPerks
}: {
  defs: D2ManifestDefinitions;
  plug: DimPlug;
  item: D2Item;
  socketInfo: DimSocket;
  curationEnabled?: boolean;
  inventoryCuratedRoll?: InventoryCuratedRoll;
  bestPerks: Set<number>;
  className?: string;
}) {
  return (
    <div
      key={plug.plugItem.hash}
      className={classNames('socket-container', className, {
        disabled: !plug.enabled,
        notChosen: plug !== socketInfo.plug
      })}
    >
      {(!curationEnabled || !inventoryCuratedRoll) && bestPerks.has(plug.plugItem.hash) && (
        <BestRatedIcon curationEnabled={curationEnabled} />
      )}
      {curationEnabled &&
        inventoryCuratedRoll &&
        inventoryCuratedRoll.curatedPerks.has(plug.plugItem.hash) && (
          <BestRatedIcon curationEnabled={curationEnabled} />
        )}
      <PressTip
        tooltip={
          <PlugTooltip
            item={item}
            plug={plug}
            defs={defs}
            curationEnabled={curationEnabled}
            bestPerks={bestPerks}
          />
        }
      >
        <div>
          <BungieImageAndAmmo
            hash={plug.plugItem.hash}
            className="item-mod"
            src={plug.plugItem.displayProperties.icon}
          />
        </div>
      </PressTip>
    </div>
  );
}
