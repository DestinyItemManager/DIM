import BungieImage from 'app/dim-ui/BungieImage';
import { DimItem, DimStat } from 'app/inventory/item-types';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { useD2Definitions } from 'app/manifest/selectors';
import { isKillTrackerSocket } from 'app/utils/item-utils';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import _ from 'lodash';
import React from 'react';
import styles from './ItemTooltip.m.scss';

export function DimItemTooltip({ item }: { item: DimItem }) {
  const defs = useD2Definitions()!;
  const itemDef = defs.InventoryItem.get(item.hash);
  if (item.bucket.sort === 'Weapons' && item.sockets) {
    const perkSockets = item.sockets?.allSockets.filter((s) => s.isPerk && !isKillTrackerSocket(s));
    const perks = _.takeRight(perkSockets, 2).flatMap((s) => {
      const perk = s.plugged?.plugDef;
      return perk ? [perk] : [];
    });
    const contents = (
      <div className={clsx(styles.perks)}>
        {perks.map((perk, index) => (
          <div key={index}>
            <DefItemIcon itemDef={perk} borderless={true} /> {perk.displayProperties.name}
          </div>
        ))}
      </div>
    );
    return <Tooltip def={itemDef} contents={contents} />;
  } else if (item.bucket.sort === 'Armor' && item.stats) {
    const renderStat = (stat: DimStat) => (
      <div key={stat.statHash} className="stat">
        {stat.displayProperties.hasIcon ? (
          <span title={stat.displayProperties.name}>
            <BungieImage src={stat.displayProperties.icon} />
          </span>
        ) : (
          stat.displayProperties.name + ': '
        )}
        {stat.base}
      </div>
    );
    const contents = (
      <div className={clsx(styles.stats, 'stat-bars', 'destiny2')}>
        <div className="stat-row">{item.stats?.filter((s) => s.statHash > 0).map(renderStat)}</div>
        <div className="stat-row">{item.stats?.filter((s) => s.statHash < 0).map(renderStat)}</div>
      </div>
    );
    return <Tooltip def={itemDef} contents={contents} />;
  } else {
    return <Tooltip def={itemDef} contents={<></>} />;
  }
}

function Tooltip({
  def,
  contents,
}: {
  def: DestinyInventoryItemDefinition;
  contents?: React.ReactNode;
}) {
  return (
    <>
      <h2>{def.displayProperties.name}</h2>
      {def.itemTypeDisplayName && <h3>{def.itemTypeDisplayName}</h3>}
      {contents}
    </>
  );
}
