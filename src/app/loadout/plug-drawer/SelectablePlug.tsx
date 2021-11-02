import ClosableContainer from 'app/dim-ui/ClosableContainer';
import RichDestinyText from 'app/dim-ui/RichDestinyText';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { StatValue } from 'app/item-popup/PlugTooltip';
import { SocketDetailsMod } from 'app/item-popup/SocketDetails';
import { useD2Definitions } from 'app/manifest/selectors';
import { armorStats } from 'app/search/d2-known-values';
import clsx from 'clsx';
import _ from 'lodash';
import React from 'react';
import styles from './SelectablePlug.m.scss';

export default function SelectablePlug({
  plug,
  selected,
  selectable,
  onPlugSelected,
  onPlugRemoved,
}: {
  plug: PluggableInventoryItemDefinition;
  selected: boolean;
  selectable: boolean;
  onPlugSelected(plug: PluggableInventoryItemDefinition): void;
  onPlugRemoved(plug: PluggableInventoryItemDefinition): void;
}) {
  const defs = useD2Definitions()!;
  const handleClick = () => {
    selectable && onPlugSelected(plug);
  };

  return (
    <ClosableContainer enabled={selected} onClose={() => onPlugRemoved(plug)}>
      <div
        className={clsx(styles.plug, {
          [styles.lockedPerk]: selected,
          [styles.unselectable]: !selectable,
        })}
        onClick={handleClick}
        role="button"
        tabIndex={0}
      >
        <SocketDetailsMod
          className={styles.iconContainer}
          itemDef={plug}
          onClick={onPlugSelected}
        />
        <div className={styles.plugInfo}>
          <div className={styles.plugTitle}>{plug.displayProperties.name}</div>
          {_.uniqBy(
            plug.perks,
            (p) => defs.SandboxPerk.get(p.perkHash).displayProperties.description
          ).map((perk) => (
            <div key={perk.perkHash}>
              <RichDestinyText
                text={defs.SandboxPerk.get(perk.perkHash).displayProperties.description}
              />
              {perk.requirementDisplayString && (
                <div className={styles.requirement}>{perk.requirementDisplayString}</div>
              )}
            </div>
          ))}
          {plug.investmentStats
            .filter((stat) => armorStats.includes(stat.statTypeHash))
            .map((stat) => (
              <div className={styles.plugStats} key={stat.statTypeHash}>
                <StatValue value={stat.value} statHash={stat.statTypeHash} />
              </div>
            ))}
        </div>
      </div>
    </ClosableContainer>
  );
}
