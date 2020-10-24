import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { StatValue } from 'app/item-popup/PlugTooltip';
import { SocketDetailsMod } from 'app/item-popup/SocketDetails';
import { TRACTION_PERK } from 'app/search/d2-known-values';
import { armorStatHashes } from 'app/search/search-filter-values';
import clsx from 'clsx';
import React from 'react';
import BungieImageAndAmmo from '../../dim-ui/BungieImageAndAmmo';
import ClosableContainer from '../ClosableContainer';
import { LockedArmor2Mod, LockedItemType } from '../types';
import styles from './SelectableBungieImage.m.scss';

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
        <SocketDetailsMod className={styles.iconContainer} itemDef={mod.modDef} defs={defs} />
        <div className={styles.perkInfo}>
          <div className={styles.perkTitle}>{mod.modDef.displayProperties.name}</div>
          {mod.modDef.perks.map((perk) => (
            <div key={perk.perkHash}>
              {defs.SandboxPerk.get(perk.perkHash).displayProperties.description}
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
