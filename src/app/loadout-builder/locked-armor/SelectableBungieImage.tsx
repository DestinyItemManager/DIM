import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage from 'app/dim-ui/BungieImage';
import RichDestinyText from 'app/dim-ui/RichDestinyText';
import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { StatValue } from 'app/item-popup/PlugTooltip';
import { SocketDetailsMod } from 'app/item-popup/SocketDetails';
import { armorStatHashes } from 'app/search/search-filter-values';
import clsx from 'clsx';
import React from 'react';
import ClosableContainer from '../ClosableContainer';
import { LockedArmor2Mod, LockedItemType } from '../types';
import styles from './SelectableBungieImage.m.scss';

export function SelectableArmor2Mod({
  mod,
  defs,
  selected,
  selectable,
  onModSelected,
  onModRemoved,
}: {
  mod: LockedArmor2Mod;
  defs: D2ManifestDefinitions;
  selected: boolean;
  selectable: boolean;
  onModSelected(mod: LockedArmor2Mod): void;
  onModRemoved(mod: LockedArmor2Mod): void;
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
        <SocketDetailsMod className={styles.iconContainer} itemDef={mod.modDef} defs={defs} />
        <div className={styles.perkInfo}>
          <div className={styles.perkTitle}>{mod.modDef.displayProperties.name}</div>
          {mod.modDef.perks.map((perk) => (
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
          {mod.modDef.investmentStats
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
