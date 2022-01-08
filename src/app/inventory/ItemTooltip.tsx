import BungieImage from 'app/dim-ui/BungieImage';
import { DimItem, DimStat } from 'app/inventory/item-types';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, stickyNoteIcon } from 'app/shell/icons';
import { isKillTrackerSocket } from 'app/utils/item-utils';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import { itemNoteSelector } from './dim-item-info';
import styles from './ItemTooltip.m.scss';

export function DimItemTooltip({ item }: { item: DimItem }) {
  const defs = useD2Definitions()!;
  const itemDef = defs.InventoryItem.get(item.hash);
  const savedNotes = useSelector(itemNoteSelector(item));

  if (item.bucket.sort === 'Weapons' && item.sockets) {
    const perkSockets = item.sockets?.allSockets.filter((s) => s.isPerk && !isKillTrackerSocket(s));
    const sockets = _.takeRight(perkSockets, 2);

    const contents = sockets.map((socket) => (
      <div key={socket.socketIndex} className={clsx(styles.perks)}>
        {socket.plugOptions.map((p) => (
          <div
            key={p.plugDef.hash}
            className={clsx(undefined, {
              [styles.perkSelected]:
                socket.isPerk && socket.plugOptions.length > 1 && p === socket.plugged,
            })}
            data-perk-name={p.plugDef.displayProperties.name}
          >
            <DefItemIcon itemDef={p.plugDef} borderless={true} /> {p.plugDef.displayProperties.name}
          </div>
        ))}
      </div>
    ));

    return <Tooltip def={itemDef} notes={savedNotes} contents={contents} />;
  } else if (item.bucket.sort === 'Armor' && item.stats?.length) {
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

    return <Tooltip def={itemDef} notes={savedNotes} contents={contents} />;
  } else {
    return <Tooltip def={itemDef} notes={savedNotes} contents={undefined} />;
  }
}

function Tooltip({
  def,
  notes,
  contents,
}: {
  def: DestinyInventoryItemDefinition;
  notes?: string;
  contents?: React.ReactNode;
}) {
  return (
    <>
      <h2>{def.displayProperties.name}</h2>
      {def.itemTypeDisplayName && <h3>{def.itemTypeDisplayName}</h3>}
      {notes && (
        <div className={clsx(styles.notes)}>
          <AppIcon icon={stickyNoteIcon} />
          <span className={clsx(styles.note)}>{notes}</span>
        </div>
      )}
      {contents}
    </>
  );
}
