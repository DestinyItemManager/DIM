import { ClarityCharacterStats } from 'app/clarity/descriptions/character-stats';
import { clarityCharacterStatsSelector } from 'app/clarity/selectors';
import { settingSelector } from 'app/dim-api/selectors';
import BungieImage from 'app/dim-ui/BungieImage';
import { Tooltip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { DimCharacterStatChange } from 'app/inventory/store-types';
import { statTier } from 'app/loadout-builder/utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { StatHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { useSelector } from 'react-redux';
import styles from './StatTooltip.m.scss';

interface Stat {
  hash: number;
  name: string;
  value: number;
  description: string;
  breakdown?: DimCharacterStatChange[];
}

const statHashToClarityName: { [key: number]: keyof ClarityCharacterStats } = {
  [StatHashes.Mobility]: 'Mobility',
  [StatHashes.Resilience]: 'Resilience',
  [StatHashes.Recovery]: 'Recovery',
  [StatHashes.Intellect]: 'Intellect',
  [StatHashes.Discipline]: 'Discipline',
  [StatHashes.Strength]: 'Strength',
};

/**
 * A rich tooltip for character-level stats like Mobility, Intellect, etc.
 */
export default function StatTooltip({
  stat,
  equippedHashes,
}: {
  stat: Stat;
  /**
   * Hashes of equipped/selected items and subclass plugs for this character or loadout. Can be limited to
   * exotic armor + subclass plugs - make sure to include default-selected subclass plugs.
   */
  equippedHashes: Set<number>;
}) {
  const tier = statTier(stat.value);
  const descriptionsToDisplay = useSelector(settingSelector('descriptionsToDisplay'));
  const useClarityInfo = descriptionsToDisplay !== 'bungie';

  return (
    <div>
      <Tooltip.Header text={stat.name} />
      <div className={styles.values}>
        <div className={styles.label}>{t('Stats.Tier', { tier })}</div>
        <div>{`${stat.value}/100`}</div>
      </div>
      <hr />
      <div>{stat.description}</div>
      {stat.breakdown?.some((contribution) => contribution.source !== 'armorStats') && (
        <>
          <hr />
          <div className={styles.breakdown}>
            {stat.breakdown.map((contribution) => (
              <div
                key={contribution.hash}
                className={clsx(styles.row, {
                  [styles.boostedValue]: contribution.source === 'runtimeEffect',
                })}
              >
                <span>
                  {contribution.source !== 'armorStats' &&
                    contribution.source !== 'subclassPlug' &&
                    `${contribution.count}x`}
                </span>
                <span>
                  {contribution.icon && <img className={styles.icon} src={contribution.icon} />}
                </span>
                <span>{contribution.name}</span>
                <span className={styles.breakdownValue}>
                  {contribution.source !== 'armorStats' && contribution.value > 0 ? '+' : ''}
                  {contribution.value}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
      {useClarityInfo && (
        <ClarityStatInfo statHash={stat.hash} tier={tier} equippedHashes={equippedHashes} />
      )}
    </div>
  );
}

/**
 * Use Clarity's database of cooldown info to show extended, accurate cooldown info for equipped subclass mods and exotics.
 */
function ClarityStatInfo({
  statHash,
  tier,
  equippedHashes,
}: {
  statHash: number;
  tier: number;
  /**
   * Hashes of equipped/selected items and subclass plugs for this character or loadout. Can be limited to
   * exotic armor + subclass plugs - make sure to include default-selected subclass plugs. This is used to
   * determine which cooldowns to show and also to calculate any overrides from aspects or exotics.
   */
  equippedHashes: Set<number>;
}) {
  const defs = useD2Definitions()!;
  const clarityCharacterStats = useSelector(clarityCharacterStatsSelector);
  const descriptionsToDisplay = useSelector(settingSelector('descriptionsToDisplay'));
  const useClarityInfo = descriptionsToDisplay !== 'bungie';
  const clarityStatData = clarityCharacterStats?.[statHashToClarityName[statHash]];

  // TODO: only show effects for equipped stuff
  // TODO: graph? or at least show next tier
  // TODO: include icons?
  // TODO: remove common words?
  // TODO: styling, "community insights header"
  // TODO: "overrides"

  const consolidated: [cooldown: number[], item: DestinyInventoryItemDefinition][] = [];
  if (clarityStatData) {
    for (const a of clarityStatData.Abilities) {
      if (equippedHashes.size > 0 && !equippedHashes.has(a.Hash)) {
        continue;
      }
      const cooldowns = a.Cooldowns;
      const name = defs.InventoryItem.get(a.Hash);
      consolidated.push([cooldowns, name]);
    }
  }

  console.log({ useClarityInfo, clarityCharacterStats, clarityStatData, consolidated });

  if (!clarityStatData) {
    return null;
  }

  // Cooldowns that are not about some specific ability
  const intrinsicCooldowns: JSX.Element[] = [];
  if ('TimeToFullHP' in clarityStatData) {
    intrinsicCooldowns.push(
      <div key="TimeToFullHP">
        Time to Full HP: {clarityStatData.TimeToFullHP[tier]}s
        <Graph tier={tier} cooldowns={clarityStatData.TimeToFullHP} />
      </div>
    );
  } else if ('WalkingSpeed' in clarityStatData) {
    intrinsicCooldowns.push(
      <div key="WalkingSpeed">
        Walking Speed: {clarityStatData.WalkingSpeed[tier]} m/s
        <Graph tier={tier} cooldowns={clarityStatData.WalkingSpeed} />
      </div>,
      <div key="StrafingSpeed">
        Strafing Speed: {clarityStatData.StrafeSpeed[tier]} m/s
        <Graph tier={tier} cooldowns={clarityStatData.StrafeSpeed} />
      </div>,
      <div key="CrouchingSpeed">
        Crouching Speed: {clarityStatData.CrouchSpeed[tier]} m/s
        <Graph tier={tier} cooldowns={clarityStatData.CrouchSpeed} />
      </div>
    );
  } else if ('TotalHP' in clarityStatData) {
    intrinsicCooldowns.push(
      <div key="TotalHP">
        Total HP: {clarityStatData.TotalHP[tier]} HP
        <Graph tier={tier} cooldowns={clarityStatData.TotalHP} />
      </div>,
      <div key="DamageResistance">
        Damage Resistance: {clarityStatData.DamageResistance[tier]}%
        <Graph tier={tier} cooldowns={clarityStatData.DamageResistance} />
      </div>,
      <div key="FlinchResistance">
        Flinch Resistance: {clarityStatData.FlinchResistance[tier]}%
        <Graph tier={tier} cooldowns={clarityStatData.FlinchResistance} />
      </div>
    );
  }

  return (
    <>
      {(intrinsicCooldowns.length > 0 || !_.isEmpty(consolidated)) && <hr />}
      {intrinsicCooldowns}
      {consolidated
        .sort((a, b) => a[0][tier] - b[0][tier])
        .map(([cooldowns, item]) => (
          <div key={item.hash}>
            <BungieImage src={item.displayProperties.icon} height={16} width={16} />{' '}
            {item.displayProperties.name}: {cooldowns[tier]}s
            <Graph tier={tier} cooldowns={cooldowns} />
          </div>
        ))}
    </>
  );
}

function Graph({ tier, cooldowns }: { tier: number; cooldowns: number[] }) {
  const maxCooldown = _.max(cooldowns)!;
  return (
    <div className={styles.graph}>
      {_.times(10, (i) => (
        <div
          key={i}
          className={clsx(styles.bar, { [styles.barCurrent]: i === tier })}
          style={{ height: `${(80 * cooldowns[i]) / maxCooldown}px` }}
        />
      ))}
    </div>
  );
}
