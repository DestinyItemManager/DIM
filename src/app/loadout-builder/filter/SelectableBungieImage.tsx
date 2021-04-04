import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage from 'app/dim-ui/BungieImage';
import RichDestinyText from 'app/dim-ui/RichDestinyText';
import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { StatValue } from 'app/item-popup/PlugTooltip';
import { SocketDetailsMod } from 'app/item-popup/SocketDetails';
import { armorStatHashes } from 'app/search/search-filter-values';
import clsx from 'clsx';
import _ from 'lodash';
import React from 'react';
import ClosableContainer from '../ClosableContainer';
import { LockedItemType } from '../types';
import styles from './SelectableBungieImage.m.scss';

export function SelectableMod({
  mod,
  defs,
  selected,
  selectable,
  onModSelected,
  onModRemoved,
}: {
  mod: PluggableInventoryItemDefinition;
  defs: D2ManifestDefinitions;
  selected: boolean;
  selectable: boolean;
  onModSelected(mod: PluggableInventoryItemDefinition): void;
  onModRemoved(mod: PluggableInventoryItemDefinition): void;
}) {
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
        <SocketDetailsMod className={styles.iconContainer} itemDef={mod} defs={defs} />
        <div className={styles.perkInfo}>
          <div className={styles.perkTitle}>{mod.displayProperties.name}</div>
          {_.uniqBy(
            mod.perks,
            (p) => defs.SandboxPerk.get(p.perkHash).displayProperties.description
          ).map((perk) => (
            <div key={perk.perkHash}>
              <RichDestinyText
                text={defs.SandboxPerk.get(perk.perkHash).displayProperties.description}
                defs={defs}
              />
              {perk.requirementDisplayString && (
                <div className={styles.requirement}>{perk.requirementDisplayString}</div>
              )}
            </div>
          ))}
          {mod.investmentStats
            .filter((stat) => armorStatHashes.includes(stat.statTypeHash))
            .map((stat) => (
              <div className={styles.plugStats} key={stat.statTypeHash}>
                <StatValue value={stat.value} defs={defs} statHash={stat.statTypeHash} />
              </div>
            ))}
        </div>
      </div>
    </ClosableContainer>
  );
}

/**
 * A perk option in the PerkPicker.
 */
export function SelectablePerk({
  perk,
  bucket,
  defs,
  selected,
  selectable,
  onLockedPerk,
}: {
  perk: PluggableInventoryItemDefinition;
  bucket: InventoryBucket;
  defs: D2ManifestDefinitions;
  selected: boolean;
  selectable: boolean;
  onLockedPerk(perk: LockedItemType): void;
}) {
  const sandboxPerk = Boolean(perk.perks?.length) && defs.SandboxPerk.get(perk.perks[0].perkHash);

  const handleClick = (e) => {
    e.preventDefault();
    selectable && onLockedPerk({ type: 'perk', perk, bucket });
  };

  return (
    <div
      className={clsx(styles.perk, {
        [styles.lockedPerk]: selected,
        [styles.unselectable]: !selectable,
      })}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      <BungieImage title={perk.displayProperties.name} src={perk.displayProperties.icon} />
      <div className={styles.perkInfo}>
        <div className={styles.perkTitle}>{perk.displayProperties.name}</div>
        <div className={styles.perkDescription}>
          {sandboxPerk
            ? sandboxPerk.displayProperties.description
            : perk.displayProperties.description}
        </div>
      </div>
    </div>
  );
}
