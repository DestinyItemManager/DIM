import { ClarityCharacterStats } from 'app/clarity/descriptions/character-stats';
import { clarityCharacterStatsSelector } from 'app/clarity/selectors';
import { settingSelector } from 'app/dim-api/selectors';
import BungieImage from 'app/dim-ui/BungieImage';
import { Tooltip } from 'app/dim-ui/PressTip';
import { useD2Definitions } from 'app/manifest/selectors';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { StatHashes } from 'data/d2/generated-enums';
import { t } from 'i18next';
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
      if (!equippedHashes.has(a.Hash)) {
        continue;
      }
      const cooldowns = a.Cooldowns.map((c) => Math.round(c));
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
      <StatTableRow
        key="TimeToFullHP"
        name="Time to Full HP"
        cooldowns={clarityStatData.TimeToFullHP}
        tier={tier}
        unit="s"
      />
    );
  } else if ('WalkingSpeed' in clarityStatData) {
    intrinsicCooldowns.push(
      <StatTableRow
        key="WalkingSpeed"
        name="Walking"
        cooldowns={clarityStatData.WalkingSpeed}
        tier={tier}
        unit="m/s"
      />,
      <StatTableRow
        key="StrafingSpeed"
        name="Strafing"
        cooldowns={clarityStatData.StrafeSpeed}
        tier={tier}
        unit="m/s"
      />,
      <StatTableRow
        key="CrouchingSpeed"
        name="Crouching"
        cooldowns={clarityStatData.CrouchSpeed}
        tier={tier}
        unit="m/s"
      />
    );
  } else if ('TotalHP' in clarityStatData) {
    intrinsicCooldowns.push(
      <StatTableRow
        key="TotalHP"
        name="Total HP"
        cooldowns={clarityStatData.TotalHP}
        tier={tier}
        unit="HP"
      />,
      <StatTableRow
        key="DamageResistance"
        name="Damage Resist"
        cooldowns={clarityStatData.DamageResistance}
        tier={tier}
        unit="%"
      />,
      <StatTableRow
        key="FlinchResistance"
        name="Flinch Resist"
        cooldowns={clarityStatData.FlinchResistance}
        tier={tier}
        unit="%"
      />
    );
  }

  if (intrinsicCooldowns.length + consolidated.length === 0) {
    return null;
  }

  return (
    <Tooltip.Section className={styles.communityInsightSection}>
      <h3>{t('MovePopup.CommunityData')}</h3>
      <table>
        <thead>
          <th />
          {tier - 1 >= 0 && (
            <>
              <th>{t('LoadoutBuilder.TierNumber', { tier: tier - 1 })}</th>
              <th />
            </>
          )}
          <th className={styles.currentColumn}>{t('LoadoutBuilder.TierNumber', { tier })}</th>
          <th />
          {tier + 1 <= 10 && (
            <>
              <th>{t('LoadoutBuilder.TierNumber', { tier: tier + 1 })}</th>
              <th />
            </>
          )}
        </thead>
        <tbody>
          {consolidated
            .sort((a, b) => a[0][tier] - b[0][tier])
            .map(([cooldowns, item]) => (
              <StatTableRow
                key={item.hash}
                name={item.displayProperties.name}
                icon={item.displayProperties.icon}
                cooldowns={cooldowns}
                tier={tier}
                unit="s"
              />
            ))}
          {intrinsicCooldowns}
        </tbody>
      </table>
    </Tooltip.Section>
  );
}

function StatTableRow({
  name,
  icon,
  cooldowns,
  tier,
  unit,
}: {
  name: string;
  icon?: string;
  unit: string;
  tier: number;
  cooldowns: number[];
}) {
  const unitEl = <td className={styles.unit}>{unit}</td>;

  return (
    <tr>
      <th>
        {icon && <BungieImage src={icon} height={16} width={16} />}
        {name}
      </th>
      {tier - 1 >= 0 && (
        <>
          <td>{cooldowns[tier - 1].toLocaleString()}</td>
          {unitEl}
        </>
      )}
      <td className={styles.currentColumn}>{cooldowns[tier].toLocaleString()}</td>
      {unitEl}
      {tier + 1 <= 10 && (
        <>
          <td>{cooldowns[tier + 1].toLocaleString()}</td>
          {unitEl}
        </>
      )}
    </tr>
  );
}
