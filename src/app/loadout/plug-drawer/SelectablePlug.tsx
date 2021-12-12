import ClosableContainer from 'app/dim-ui/ClosableContainer';
import RichDestinyText from 'app/dim-ui/RichDestinyText';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { StatValue } from 'app/item-popup/PlugTooltip';
import { useD2Definitions } from 'app/manifest/selectors';
import { ItemPerkVisibility } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React, { useCallback } from 'react';
import styles from './SelectablePlug.m.scss';

export default function SelectablePlug({
  plug,
  selected,
  selectable,
  displayedStatHashes,
  onPlugSelected,
  onPlugRemoved,
}: {
  plug: PluggableInventoryItemDefinition;
  selected: boolean;
  selectable: boolean;
  displayedStatHashes?: number[];
  onPlugSelected(plug: PluggableInventoryItemDefinition): void;
  onPlugRemoved(plug: PluggableInventoryItemDefinition): void;
}) {
  const defs = useD2Definitions()!;

  const handleClick = useCallback(() => {
    selectable && onPlugSelected(plug);
  }, [onPlugSelected, plug, selectable]);

  const onClose = useCallback(() => onPlugRemoved(plug), [onPlugRemoved, plug]);
  const displayedStats = plug.investmentStats.filter((stat) =>
    displayedStatHashes?.includes(stat.statTypeHash)
  );

  // within this plug, let's not repeat any descriptions or requirement strings
  const uniqueStrings = new Set<string>();

  return (
    <ClosableContainer onClose={selected ? onClose : undefined}>
      <div
        className={clsx(styles.plug, {
          [styles.lockedPerk]: selected,
          [styles.unselectable]: !selectable,
        })}
        onClick={handleClick}
        role="button"
        tabIndex={0}
      >
        <div className={clsx('item', styles.iconContainer)} title={plug.displayProperties.name}>
          <DefItemIcon itemDef={plug} />
        </div>
        <div className={styles.plugInfo}>
          <div className={styles.plugTitle}>{plug.displayProperties.name}</div>
          {plug.perks.map((perk) => {
            if (perk.perkVisibility === ItemPerkVisibility.Hidden) {
              return null;
            }
            const defDesc = defs.SandboxPerk.get(perk.perkHash).displayProperties.description;
            const defReq = perk.requirementDisplayString;

            const description = (!uniqueStrings.has(defDesc) && defDesc) || undefined;
            const requirement = (!uniqueStrings.has(defReq) && defReq) || undefined;

            defDesc && uniqueStrings.add(defDesc);
            defReq && uniqueStrings.add(defReq);

            return description || requirement ? (
              <div className={styles.partialDescription} key={perk.perkHash}>
                <RichDestinyText text={description} />
                {requirement && <div className={styles.requirement}>{requirement}</div>}
              </div>
            ) : null;
          })}
          {plug.displayProperties.description &&
            !uniqueStrings.has(plug.displayProperties.description) && (
              // if uniqueStrings has entries, then we printed some perks. if that's true,
              // and description is still unique, this means description is basically a "requirements"
              // string like "This mod's perks are only active" etc etc etc
              <div className={uniqueStrings.size ? styles.requirement : styles.partialDescription}>
                <RichDestinyText text={plug.displayProperties.description} />
              </div>
            )}
          {displayedStats.length > 0 && (
            <div className="plug-stats">
              {displayedStats.map((stat) => (
                <StatValue
                  key={stat.statTypeHash}
                  statHash={stat.statTypeHash}
                  value={stat.value}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ClosableContainer>
  );
}
