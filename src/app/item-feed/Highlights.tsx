import BungieImage from 'app/dim-ui/BungieImage';
import { PressTip } from 'app/dim-ui/PressTip';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { DimItem, DimStat } from 'app/inventory/item-types';
import { DimPlugTooltip } from 'app/item-popup/PlugTooltip';
import { compact } from 'app/utils/collections';
import { itemTypeName } from 'app/utils/item-utils';
import {
  getArmorArchetypeSocket,
  getExtraIntrinsicPerkSockets,
  getIntrinsicArmorPerkSocket,
  getWeaponArchetype,
  isEnhancedPerk,
  socketContainsIntrinsicPlug,
  socketContainsPlugWithCategory,
} from 'app/utils/socket-utils';
import clsx from 'clsx';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import '../store-stats/CharacterStats.m.scss';
import * as styles from './Highlights.m.scss';

/**
 * Some useful details about an item, meant to be shown in a summary tile on views like the Item Feed or Item Picker.
 */
export default function Highlights({ item }: { item: DimItem }) {
  if (item.bucket.inWeapons && item.sockets) {
    // Don't ask me why Traits are called "Frames" but it does work.
    const perkSockets = item.sockets.allSockets.filter(
      (s) =>
        s.isPerk &&
        (socketContainsPlugWithCategory(s, PlugCategoryHashes.Frames) ||
          (s.hasRandomizedPlugItems && socketContainsIntrinsicPlug(s))),
    );
    const archetype = !item.isExotic && getWeaponArchetype(item)?.displayProperties.name;

    return (
      <>
        <span className={styles.type}>
          {archetype} <div>{itemTypeName(item)}</div>
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
                <PressTip
                  key={p.plugDef.hash}
                  tooltip={() => <DimPlugTooltip item={item} plug={p} />}
                  className={styles.perk}
                >
                  <div
                    className={clsx({
                      [styles.enhancedArrow]: isEnhancedPerk(p.plugDef),
                    })}
                  >
                    <DefItemIcon itemDef={p.plugDef} borderless={true} />
                  </div>
                  {p.plugDef.displayProperties.name}
                </PressTip>
              ))}
            </div>
          ))}
        </div>
      </>
    );
  } else if (item.bucket.inArmor) {
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
    const extraIntrinsicSockets = compact([
      getIntrinsicArmorPerkSocket(item),
      ...getExtraIntrinsicPerkSockets(item),
      getArmorArchetypeSocket(item),
    ]);
    return (
      <>
        <div className={styles.stats}>
          <div className={clsx(styles.statRow, styles.armorStats)}>
            {item.stats?.filter((s) => s.statHash > 0).map(renderStat)}
          </div>
          <div className={styles.statRow}>
            {item.stats?.filter((s) => s.statHash < 0).map(renderStat)}
          </div>
        </div>
        {extraIntrinsicSockets.length > 0 && (
          <div className={styles.perks}>
            {extraIntrinsicSockets.map((s) => (
              <div
                key={s.socketIndex}
                className={clsx({
                  [styles.multiPerk]: s.isPerk && s.plugOptions.length > 1,
                })}
              >
                {s.plugOptions.map((p) => (
                  <PressTip
                    key={p.plugDef.hash}
                    tooltip={() => <DimPlugTooltip item={item} plug={p} />}
                    className={styles.perk}
                  >
                    <DefItemIcon itemDef={p.plugDef} borderless={true} />
                    {p.plugDef.displayProperties.name}
                  </PressTip>
                ))}
              </div>
            ))}
          </div>
        )}
      </>
    );
  }
  return null;
}
