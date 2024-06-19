import BungieImage from 'app/dim-ui/BungieImage';
import { PressTip } from 'app/dim-ui/PressTip';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { DimItem, DimStat } from 'app/inventory/item-types';
import { ItemTypeName } from 'app/item-popup/ItemPopupHeader';
import { DimPlugTooltip } from 'app/item-popup/PlugTooltip';
import {
  getWeaponArchetype,
  socketContainsIntrinsicPlug,
  socketContainsPlugWithCategory,
} from 'app/utils/socket-utils';
import clsx from 'clsx';
import { BucketHashes, PlugCategoryHashes } from 'data/d2/generated-enums';
import '../store-stats/CharacterStats.scss';
import styles from './Highlights.m.scss';

/**
 * Some useful details about an item, meant to be shown in a summary tile on views like the Item Feed or Item Picker.
 */
export default function Highlights({ item }: { item: DimItem }) {
  if (item.bucket.sort === 'Weapons' && item.sockets) {
    // Don't ask me why Traits are called "Frames" but it does work.
    const perkSockets = item.sockets.allSockets.filter(
      (s) => s.isPerk && socketContainsPlugWithCategory(s, PlugCategoryHashes.Frames),
    );
    const archetype = !item.isExotic && getWeaponArchetype(item)?.displayProperties.name;

    return (
      <div>
        <span className={styles.type}>
          {archetype} <ItemTypeName item={item} />
        </span>
        <div className={styles.perks}>
          {perkSockets.map((s) => (
            <div
              key={s.socketIndex}
              className={clsx({
                [styles.multiPerk]: s.isPerk && s.plugOptions.length > 1,
              })}
            >
              {s.plugOptions.map((p) => (
                <div key={p.plugDef.hash}>
                  <PressTip tooltip={() => <DimPlugTooltip item={item} plug={p} />}>
                    <DefItemIcon itemDef={p.plugDef} borderless={true} />{' '}
                    {p.plugDef.displayProperties.name}
                  </PressTip>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  } else if (item.bucket.sort === 'Armor') {
    const renderStat = (stat: DimStat) => (
      <div key={stat.statHash} className="stat">
        {stat.displayProperties.hasIcon ? (
          <span title={stat.displayProperties.name}>
            <BungieImage src={stat.displayProperties.icon} />
          </span>
        ) : (
          `${stat.displayProperties.name}: `
        )}
        {stat.value}
      </div>
    );
    // exotic class armor intrinsics
    const extraIntrinsicSockets =
      item.isExotic && item.bucket.hash === BucketHashes.ClassArmor && item.sockets
        ? item.sockets.allSockets.filter(
            (s) => s.isPerk && s.visibleInGame && socketContainsIntrinsicPlug(s),
          )
        : [];
    return (
      <>
        {item.bucket.hash !== BucketHashes.ClassArmor && (
          <div className={clsx(styles.stats, 'stat-bars', 'destiny2')}>
            <div className="stat-row">
              {item.stats?.filter((s) => s.statHash > 0).map(renderStat)}
            </div>
            <div className="stat-row">
              {item.stats?.filter((s) => s.statHash < 0).map(renderStat)}
            </div>
          </div>
        )}
        {extraIntrinsicSockets.length > 0 && (
          <div className={styles.perks}>
            {extraIntrinsicSockets
              .flatMap((s) => s.plugOptions)
              .map((p) => (
                <div key={p.plugDef.hash}>
                  <PressTip tooltip={() => <DimPlugTooltip item={item} plug={p} />}>
                    <DefItemIcon itemDef={p.plugDef} borderless={true} />{' '}
                    {p.plugDef.displayProperties.name}
                  </PressTip>
                </div>
              ))}
          </div>
        )}
      </>
    );
  }
  return null;
}
