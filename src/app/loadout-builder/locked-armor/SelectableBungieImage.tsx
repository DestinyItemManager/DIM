import clsx from 'clsx';
import { t } from 'app/i18next-t';
import React from 'react';
import { LockedItemType, BurnItem, LockedModBase, LockedArmor2Mod } from '../types';
import BungieImageAndAmmo from '../../dim-ui/BungieImageAndAmmo';
import styles from './SelectableBungieImage.m.scss';
import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { SocketDetailsMod } from 'app/item-popup/SocketDetails';
import ClosableContainer from '../ClosableContainer';
import { TRACTION_PERK } from 'app/search/d2-known-values';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';

const badPerk = new Set([
  3201772785, // power weapon targeting
  351326616, // energy weapon targeting
  2839066781, // kinetic weapon targeting
  4255886137, // power weapon loader
  182444936, // energy weapon loader
  4043093993, // kinetic weapon loader
  3647557929, // unflinching large arms
  1204062917, // unflinching power aim
  2317587052, // unflinching energy aim
  527286589, // unflinching kinetic aim
  952165152, // power dexterity
  377666359, // energy dexterity
  2326218464, // kinetic dexterity
]);

/**
 * A mod option in the PerkPicker.
 */
export function SelectableMod({
  mod,
  plugSetHash,
  defs,
  bucket,
  selected,
  unselectable,
  onLockedPerk,
  onLockedModBase,
}: {
  mod: PluggableInventoryItemDefinition;
  // plugSet this mod appears in
  plugSetHash: number;
  defs: D2ManifestDefinitions;
  bucket?: InventoryBucket;
  selected: boolean;
  unselectable?: boolean;
  onLockedPerk?(perk: LockedItemType): void;
  onLockedModBase?(mod: LockedModBase): void;
}) {
  const handleClick = (e) => {
    e.preventDefault();
    if (bucket && onLockedPerk) {
      onLockedPerk({ type: 'mod', mod, plugSetHash, bucket });
    } else if (onLockedModBase) {
      onLockedModBase({ mod, plugSetHash });
    }
  };

  const perk = Boolean(mod.perks?.length) && defs.SandboxPerk.get(mod.perks[0].perkHash);

  return (
    <div
      className={clsx(styles.perk, {
        [styles.lockedPerk]: selected,
        [styles.unselectable]: unselectable,
      })}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      <SocketDetailsMod itemDef={mod} defs={defs} />
      <div className={styles.perkInfo}>
        <div className={styles.perkTitle}>{mod.displayProperties.name}</div>
        <div className={styles.perkDescription}>
          {perk ? perk.displayProperties.description : mod.displayProperties.description}
        </div>
      </div>
    </div>
  );
}

export function SelectableArmor2Mod({
  mod,
  defs,
  selected,
  unselectable,
  onModSelected,
  onModRemoved,
}: {
  mod: LockedArmor2Mod;
  defs: D2ManifestDefinitions;
  selected: boolean;
  unselectable: boolean;
  onModSelected(mod: LockedArmor2Mod): void;
  onModRemoved(mod: LockedArmor2Mod): void;
}) {
  const handleClick = () => {
    !unselectable && onModSelected(mod);
  };

  return (
    <ClosableContainer enabled={selected} onClose={() => onModRemoved(mod)}>
      <div
        className={clsx(styles.perk, {
          [styles.lockedPerk]: selected,
          [styles.unselectable]: unselectable,
        })}
        onClick={handleClick}
        role="button"
        tabIndex={0}
      >
        <SocketDetailsMod itemDef={mod.mod} defs={defs} />
        <div className={styles.perkInfo}>
          <div className={styles.perkTitle}>{mod.mod.displayProperties.name}</div>
          <div className={styles.perkDescription}>{mod.mod.displayProperties.description}</div>
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
  unselectable,
  onLockedPerk,
}: {
  perk: PluggableInventoryItemDefinition;
  bucket: InventoryBucket;
  defs: D2ManifestDefinitions;
  selected: boolean;
  unselectable: boolean;
  onLockedPerk(perk: LockedItemType): void;
}) {
  const isBadPerk = badPerk.has(perk.hash);
  const sandboxPerk = Boolean(perk.perks?.length) && defs.SandboxPerk.get(perk.perks[0].perkHash);

  const handleClick = (e) => {
    e.preventDefault();
    onLockedPerk({ type: 'perk', perk, bucket });
  };

  return (
    <div
      className={clsx(styles.perk, {
        [styles.lockedPerk]: selected,
        [styles.unselectable]: unselectable,
      })}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      <BungieImageAndAmmo
        className={clsx({
          [styles.goodPerk]: perk.hash === TRACTION_PERK,
          [styles.badPerk]: isBadPerk,
        })}
        hash={perk.hash}
        alt=""
        src={perk.displayProperties.icon}
      />
      <div className={styles.perkInfo}>
        <div className={styles.perkTitle}>{perk.displayProperties.name}</div>
        <div className={styles.perkDescription}>
          {sandboxPerk
            ? sandboxPerk.displayProperties.description
            : perk.displayProperties.description}
          {isBadPerk && <p>{t('LoadoutBuilder.BadPerk')}</p>}
          {perk.hash === TRACTION_PERK && t('LoadoutBuilder.Traction')}
        </div>
      </div>
    </div>
  );
}

/**
 * A burn option in the PerkPicker.
 */
export function SelectableBurn({
  burn,
  bucket,
  selected,
  unselectable,
  onLockedPerk,
}: {
  burn: BurnItem;
  bucket: InventoryBucket;
  selected: boolean;
  unselectable: boolean;
  onLockedPerk(burn: LockedItemType): void;
}) {
  const handleClick = (e) => {
    e.preventDefault();
    onLockedPerk({ type: 'burn', burn, bucket });
  };

  return (
    <div
      className={clsx(styles.perk, {
        [styles.lockedPerk]: selected,
        [styles.unselectable]: unselectable,
      })}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      <img className={`perk-image ${burn.dmg}`} alt="" src={burn.displayProperties.icon} />
      <div className={styles.perkInfo}>
        <div className={styles.perkTitle}>{burn.displayProperties.name}</div>
      </div>
    </div>
  );
}
