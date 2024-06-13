import BungieImage, { bungieNetPath } from 'app/dim-ui/BungieImage';
import FractionalPowerLevel from 'app/dim-ui/FractionalPowerLevel';
import { PressTip } from 'app/dim-ui/PressTip';
import { showGearPower } from 'app/gear-power/gear-power';
import { t } from 'app/i18next-t';
import { ArtifactXP } from 'app/inventory/ArtifactXP';
import { ItemPowerSet } from 'app/inventory/ItemPowerSet';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { profileResponseSelector } from 'app/inventory/selectors';
import type { DimStore } from 'app/inventory/store-types';
import { StorePowerLevel, powerLevelSelector } from 'app/inventory/store/selectors';
import { statTier } from 'app/loadout-builder/utils';
import { getLoadoutStats } from 'app/loadout-drawer/loadout-utils';
import { getSubclassPlugHashes } from 'app/loadout/item-utils';
import { Loadout, ResolvedLoadoutItem } from 'app/loadout/loadout-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { getCharacterProgressions } from 'app/progress/selectors';
import { armorStats } from 'app/search/d2-known-values';
import { RootState } from 'app/store/types';
import clsx from 'clsx';
import { BucketHashes, StatHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import helmetIcon from '../../../destiny-icons/armor_types/helmet.svg';
import xpIcon from '../../images/xpIcon.svg';
import './CharacterStats.scss';
import StatTooltip from './StatTooltip';

function CharacterPower({ stats }: { stats: PowerStat[] }) {
  return (
    <div className={clsx('stat-row', 'powerFormula')}>
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
                  <div className="richTooltipWrapper">{stat.richTooltipContent()}</div>
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
            <img src={stat.icon} alt={stat.name} />
            <div>
              <span className="powerStat">
                <FractionalPowerLevel power={stat.value} />
              </span>
              {stat.problems?.hasClassified && <sup className="asterisk">*</sup>}
            </div>
          </div>
        </PressTip>
      ))}
    </div>
  );
}

interface PowerStat {
  value: number;
  icon: string;
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
    icon: bungieNetPath(defs.Stat.get(StatHashes.Power).displayProperties.icon),
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
        <div className="dropLevel">
          <span>{t('Stats.DropLevel')}*</span>
          <span>
            <FractionalPowerLevel power={powerLevel.dropPower} />
          </span>
        </div>
        <div className="tooltipFootnote">* {t('General.ClickForDetails')}</div>
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

  return <CharacterPower stats={[maxTotalPower, maxGearPower, artifactPower]} />;
}

/**
 * Display each of the main stats (Resistance, Discipline, etc) for a character. The actual stat info is passed in.
 * This shows stats for both loadouts and characters - anything that has a character stats list.
 */
function CharacterStats({
  stats,
  showTier,
  equippedHashes,
}: {
  stats: DimStore['stats'];
  showTier?: boolean;
  equippedHashes: Set<number>;
}) {
  // Select only the armor stats, in the correct order
  const statInfos = armorStats.map((h) => stats[h]);

  return (
    <div className="stat-row">
      {showTier && (
        <div className="stat tier">
          {t('LoadoutBuilder.TierNumber', {
            tier: _.sumBy(statInfos, (s) => statTier(s.value)),
          })}
        </div>
      )}
      {statInfos.map((stat) => (
        <PressTip
          key={stat.hash}
          tooltip={<StatTooltip stat={stat} equippedHashes={equippedHashes} />}
        >
          <div
            className={clsx('stat', {
              boostedValue: stat.breakdown?.some((change) => change.source === 'runtimeEffect'),
            })}
            aria-label={`${stat.name} ${stat.value}`}
            role="group"
          >
            <BungieImage src={stat.icon} alt={stat.name} />
            <div>{stat.value}</div>
          </div>
        </PressTip>
      ))}
    </div>
  );
}

/**
 * Show the stats for a DimStore.
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
 * Show the stats for a DIM Loadout.
 */
// TODO: just take a FullyResolvedLoadout?
export function LoadoutCharacterStats({
  loadout,
  subclass,
  items,
  allMods,
}: {
  loadout: Loadout;
  subclass?: ResolvedLoadoutItem;
  allMods: PluggableInventoryItemDefinition[];
  items?: (ResolvedLoadoutItem | DimItem)[];
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

  return <CharacterStats showTier stats={stats} equippedHashes={equippedHashes} />;
}
