import ClosableContainer from 'app/dim-ui/ClosableContainer';
import RichDestinyText from 'app/dim-ui/RichDestinyText';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import { StatValue } from 'app/item-popup/PlugTooltip';
import { useD2Definitions } from 'app/manifest/selectors';
import clsx from 'clsx';
import _ from 'lodash';
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
  const stats = plug.investmentStats.filter((stat) =>
    displayedStatHashes?.includes(stat.statTypeHash)
  );

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
          {_.uniqBy(
            plug.perks,
            (p) => defs.SandboxPerk.get(p.perkHash).displayProperties.description
          ).map((perk) => (
            <div className={styles.partialDescription} key={perk.perkHash}>
              <RichDestinyText
                text={defs.SandboxPerk.get(perk.perkHash).displayProperties.description}
              />
              {perk.requirementDisplayString && (
                <div className={styles.requirement}>{perk.requirementDisplayString}</div>
              )}
            </div>
          ))}
          {plug.displayProperties.description && (
            <div className={styles.partialDescription}>
              <RichDestinyText text={plug.displayProperties.description} />
            </div>
          )}
          {stats.length > 0 && (
            <div className="plug-stats">
              {stats.map((stat) => (
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
