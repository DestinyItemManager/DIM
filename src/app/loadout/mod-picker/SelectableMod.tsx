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
import styles from './SelectableMod.m.scss';

function SelectableMod({
  mod,
  selected,
  selectable,
  onModSelected,
  onModRemoved,
}: {
  mod: PluggableInventoryItemDefinition;
  selected: boolean;
  selectable: boolean;
  onModSelected(mod: PluggableInventoryItemDefinition): void;
  onModRemoved(mod: PluggableInventoryItemDefinition): void;
}) {
  const defs = useD2Definitions()!;
  const handleClick = () => {
    selectable && onModSelected(mod);
  };

  return (
    <ClosableContainer enabled={selected} onClose={() => onModRemoved(mod)}>
      <div
        className={clsx(styles.perk, {
          [styles.lockedPerk]: selected,
          [styles.unselectable]: !selectable,
        })}
        onClick={handleClick}
        role="button"
        tabIndex={0}
      >
        <SocketDetailsMod className={styles.iconContainer} itemDef={mod} />
        <div className={styles.perkInfo}>
          <div className={styles.perkTitle}>{mod.displayProperties.name}</div>
          {_.uniqBy(
            mod.perks,
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
          {mod.investmentStats
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

export default SelectableMod;
