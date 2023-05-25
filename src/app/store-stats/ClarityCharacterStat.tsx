import { ClarityCharacterStats } from 'app/clarity/descriptions/character-stats';
import { clarityCharacterStatsSelector } from 'app/clarity/selectors';
import { settingSelector } from 'app/dim-api/selectors';
import BungieImage from 'app/dim-ui/BungieImage';
import { Tooltip } from 'app/dim-ui/PressTip';
import { useD2Definitions } from 'app/manifest/selectors';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { StatHashes } from 'data/d2/generated-enums';
import { t } from 'i18next';
import _ from 'lodash';
import { useSelector } from 'react-redux';
import styles from './ClarityCharacterStat.m.scss';

const statHashToClarityName: { [key: number]: keyof ClarityCharacterStats } = {
  [StatHashes.Mobility]: 'Mobility',
  [StatHashes.Resilience]: 'Resilience',
  [StatHashes.Recovery]: 'Recovery',
  [StatHashes.Intellect]: 'Intellect',
  [StatHashes.Discipline]: 'Discipline',
  [StatHashes.Strength]: 'Strength',
};

/**
 * Use Clarity's database of cooldown info to show extended, accurate cooldown info for equipped subclass mods and exotics.
 */
export default function ClarityCharacterStat({
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
        Time to Full HP: {clarityStatData.TimeToFullHP[tier].toLocaleString()}s
        <Graph tier={tier} cooldowns={clarityStatData.TimeToFullHP} />
      </div>
    );
  } else if ('WalkingSpeed' in clarityStatData) {
    intrinsicCooldowns.push(
      <div key="WalkingSpeed">
        Walking Speed: {clarityStatData.WalkingSpeed[tier].toLocaleString()}m/s
        <Graph tier={tier} cooldowns={clarityStatData.WalkingSpeed} />
      </div>,
      <div key="StrafingSpeed">
        Strafing Speed: {clarityStatData.StrafeSpeed[tier].toLocaleString()}m/s
        <Graph tier={tier} cooldowns={clarityStatData.StrafeSpeed} />
      </div>,
      <div key="CrouchingSpeed">
        Crouching Speed: {clarityStatData.CrouchSpeed[tier].toLocaleString()}m/s
        <Graph tier={tier} cooldowns={clarityStatData.CrouchSpeed} />
      </div>
    );
  } else if ('TotalHP' in clarityStatData) {
    intrinsicCooldowns.push(
      <div key="TotalHP">
        Total HP: {clarityStatData.TotalHP[tier].toLocaleString()} HP
        <Graph tier={tier} cooldowns={clarityStatData.TotalHP} />
      </div>,
      <div key="DamageResistance">
        Damage Resistance: {clarityStatData.DamageResistance[tier].toLocaleString()}%
        <Graph tier={tier} cooldowns={clarityStatData.DamageResistance} />
      </div>,
      <div key="FlinchResistance">
        Flinch Resistance: {clarityStatData.FlinchResistance[tier].toLocaleString()}%
        <Graph tier={tier} cooldowns={clarityStatData.FlinchResistance} />
      </div>
    );
  }

  if (intrinsicCooldowns.length + consolidated.length === 0) {
    return null;
  }

  return (
    <Tooltip.Section className={styles.communityInsightSection}>
      <h3>{t('MovePopup.CommunityData')}</h3>
      {consolidated
        .sort((a, b) => a[0][tier] - b[0][tier])
        .map(([cooldowns, item]) => (
          <div key={item.hash}>
            <BungieImage src={item.displayProperties.icon} height={16} width={16} />{' '}
            {item.displayProperties.name}: {Math.round(cooldowns[tier]).toLocaleString()}s
            <Graph tier={tier} cooldowns={cooldowns} />
          </div>
        ))}
      {intrinsicCooldowns}
    </Tooltip.Section>
  );
}

function Graph({ tier, cooldowns }: { tier: number; cooldowns: number[] }) {
  const maxCooldown = _.max(cooldowns)!;
  return (
    <div className={styles.graph}>
      {_.times(11, (i) => (
        <div
          key={i}
          className={clsx(styles.bar, { [styles.barCurrent]: i === tier })}
          style={{ height: `${(50 * cooldowns[i]) / maxCooldown}px` }}
        />
      ))}
    </div>
  );
}
