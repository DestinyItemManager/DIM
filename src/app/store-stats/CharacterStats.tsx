import BungieImage from 'app/dim-ui/BungieImage';
import FractionalPowerLevel from 'app/dim-ui/FractionalPowerLevel';
import { PressTip } from 'app/dim-ui/PressTip';
import { showGearPower } from 'app/gear-power/gear-power';
import { t } from 'app/i18next-t';
import { ArtifactXP } from 'app/inventory/ArtifactXP';
import { ItemPowerSet } from 'app/inventory/ItemPowerSet';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { profileResponseSelector } from 'app/inventory/selectors';
import type { DimCharacterStat, DimStore } from 'app/inventory/store-types';
import { StorePowerLevel, powerLevelSelector } from 'app/inventory/store/selectors';
import { getLoadoutStats } from 'app/loadout-drawer/loadout-utils';
import { getSubclassPlugHashes } from 'app/loadout/loadout-item-utils';
import { Loadout, ResolvedLoadoutItem } from 'app/loadout/loadout-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { getCharacterProgressions } from 'app/progress/selectors';
import { armorStats } from 'app/search/d2-known-values';
import AppIcon from 'app/shell/icons/AppIcon';
import { dimPowerIcon } from 'app/shell/icons/custom/Power';
import { RootState } from 'app/store/types';
import { filterMap, sumBy } from 'app/utils/collections';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import React from 'react';
import { useSelector } from 'react-redux';
import helmetIcon from '../../../destiny-icons/armor_types/helmet.svg';
import xpIcon from '../../images/xpIcon.svg';
import * as styles from './CharacterStats.m.scss';
import StatTooltip from './StatTooltip';

function CharacterPower({ stats }: { stats: PowerStat[] }) {
  return (
    <div className={styles.powerFormula}>
      {stats.map((stat) => (
        <PressTip
          key={stat.name}
          tooltip={() => (
            <>
              {stat.name}
              {stat.problems?.hasClassified && `\n\n${t('Loadouts.Classified')}`}
              {stat.richTooltipContent && (
                <>
                  <hr />
                  <div className={styles.richTooltipWrapper}>{stat.richTooltipContent()}</div>
                </>
              )}
            </>
          )}
        >
          <div
            className="stat"
            aria-label={`${stat.name} ${stat.value}`}
            role={stat.onClick ? 'button' : 'group'}
            onClick={stat.onClick}
          >
            {typeof stat.icon === 'string' ? <img src={stat.icon} alt={stat.name} /> : stat.icon}

            <div className={styles.powerStat}>
              <FractionalPowerLevel power={stat.value} />
            </div>
            {stat.problems?.hasClassified && <sup className={styles.asterisk}>*</sup>}
          </div>
        </PressTip>
      ))}
    </div>
  );
}

interface PowerStat {
  value: number;
  icon: string | React.ReactNode;
  name: string;
  richTooltipContent?: () => React.ReactNode;
  onClick?: () => void;
  problems?: StorePowerLevel['problems'];
}

export function PowerFormula({ storeId }: { storeId: string }) {
  const defs = useD2Definitions();
  const powerLevel = useSelector((state: RootState) => powerLevelSelector(state, storeId));

  const profileResponse = useSelector(profileResponseSelector);
  const characterProgress = getCharacterProgressions(profileResponse);

  if (!defs || !profileResponse || !powerLevel) {
    return null;
  }

  const maxTotalPower: PowerStat = {
    value: powerLevel.maxTotalPower,
    icon: <AppIcon icon={dimPowerIcon} />,
    name: t('Stats.MaxTotalPower'),
    problems: { ...powerLevel.problems, notOnStore: false },
  };

  const maxGearPower: PowerStat = {
    value: powerLevel.maxEquippableGearPower,
    icon: helmetIcon,
    name: t('Stats.MaxGearPowerOneExoticRule'),
    // used to be t('Stats.MaxGearPowerAll') or t('Stats.MaxGearPower'), a translation i don't want to lose yet
    problems: powerLevel.problems,
    onClick: () => showGearPower(storeId),
    richTooltipContent: () => (
      <>
        <ItemPowerSet
          items={powerLevel.highestPowerItems}
          powerFloor={Math.floor(powerLevel.maxGearPower)}
        />
        <hr />
        <div className={styles.dropLevel}>
          <span>{t('Stats.DropLevel')}*</span>
          <span>
            <FractionalPowerLevel power={powerLevel.dropPower} />
          </span>
        </div>
        <div className={styles.tooltipFootnote}>* {t('General.ClickForDetails')}</div>
      </>
    ),
  };

  // optional chaining here accounts for an edge-case, possible, but type-unadvertised,
  // missing artifact power bonus. please keep this here.
  const bonusPowerProgressionHash =
    profileResponse.profileProgression?.data?.seasonalArtifact?.powerBonusProgression
      ?.progressionHash;

  const artifactPower: PowerStat = {
    value: powerLevel.powerModifier,
    name: t('Stats.PowerModifier'),
    richTooltipContent: () => (
      <ArtifactXP
        characterProgress={characterProgress}
        bonusPowerProgressionHash={bonusPowerProgressionHash}
      />
    ),
    icon: xpIcon,
  };
  const stats = artifactPower.value ? [maxTotalPower, maxGearPower, artifactPower] : [maxGearPower];
  return <CharacterPower stats={stats} />;
}

/**
 * Display each of the main stats (Resistance, Discipline, etc) for a character.
 * This is used for both loadouts and characters - anything that has a character
 * stats list. This is only used for D2.
 */
export function CharacterStats({
  stats,
  showTotal,
  equippedHashes,
  className,
}: {
  /**
   * A list of stats to display. This should contain an entry for each stat in
   * `armorStats`, but if one is missing it won't be shown - you can use this to
   * show a subset of stats.
   */
  stats: {
    [hash: number]: DimCharacterStat;
  };
  /** Whether to show the total stat sum of the set. */
  showTotal?: boolean;
  /**
   * Item hashes for equipped exotics, used to show more accurate cooldown
   * tooltips.
   */
  equippedHashes: Set<number>;
  className?: string;
}) {
  // Select only the armor stats, in the correct order
  const statInfos = filterMap(armorStats, (h) => stats[h]);

  return (
    <div className={clsx(styles.armorStats, className)}>
      {showTotal && (
        <div className={clsx(styles.tier, 'stat')}>
          {t('LoadoutBuilder.StatTotal', { total: sumBy(statInfos, (s) => s.value) })}
        </div>
      )}
      {statInfos.map((stat) => (
        <PressTip
          key={stat.hash}
          tooltip={<StatTooltip stat={stat} equippedHashes={equippedHashes} />}
        >
          <div
            className={clsx('stat', {
              [styles.boostedValue]: stat.breakdown?.some(
                (change) => change.source === 'runtimeEffect',
              ),
            })}
            aria-label={`${stat.displayProperties.name} ${stat.value}`}
            role="group"
          >
            <BungieImage src={stat.displayProperties.icon} alt={stat.displayProperties.name} />
            <div>{stat.value}</div>
          </div>
        </PressTip>
      ))}
    </div>
  );
}

// TODO: just a plain "show stats" component

/**
 * Show the stats for a DimStore. This is only used for D2 - D1 uses D1CharacterStats.
 */
export function StoreCharacterStats({ store }: { store: DimStore }) {
  const equippedItems = store.items.filter((i) => i.equipped);
  const subclass = equippedItems.find((i) => i.bucket.hash === BucketHashes.Subclass);

  // All equipped items
  const equippedHashes = new Set(equippedItems.map((i) => i.hash));
  // Plus all subclass mods
  if (subclass?.sockets) {
    for (const socket of subclass.sockets.allSockets) {
      const hash = socket.plugged?.plugDef.hash;
      if (hash !== undefined) {
        equippedHashes.add(hash);
      }
    }
  }
  return <CharacterStats stats={store.stats} equippedHashes={equippedHashes} />;
}

/**
 * Show the stats for a DIM Loadout. This is only used for D2.
 */
// TODO: just take a FullyResolvedLoadout?
export function LoadoutCharacterStats({
  loadout,
  subclass,
  items,
  allMods,
  className,
}: {
  loadout: Loadout;
  subclass?: ResolvedLoadoutItem;
  allMods: PluggableInventoryItemDefinition[];
  items?: (ResolvedLoadoutItem | DimItem)[];
  className?: string;
}) {
  const defs = useD2Definitions()!;
  const equippedItems =
    items
      ?.filter((li) => ('loadoutItem' in li ? li.loadoutItem.equip && !li.missing : true))
      .map((li) => ('loadoutItem' in li ? li.item : li)) ?? [];

  // All equipped items
  const equippedHashes = new Set(equippedItems.map((i) => i.hash));
  // Plus all subclass mods
  for (const { plugHash } of getSubclassPlugHashes(subclass)) {
    equippedHashes.add(plugHash);
  }

  const stats = getLoadoutStats(
    defs,
    loadout.classType,
    subclass,
    equippedItems,
    allMods,
    loadout.parameters?.includeRuntimeStatBenefits ?? true,
  );

  return (
    <CharacterStats className={className} showTotal stats={stats} equippedHashes={equippedHashes} />
  );
}
