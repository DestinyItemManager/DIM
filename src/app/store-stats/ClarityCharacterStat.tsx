import { ClarityCharacterStats } from 'app/clarity/descriptions/character-stats';
import { clarityCharacterStatsSelector } from 'app/clarity/selectors';
import BungieImage from 'app/dim-ui/BungieImage';
import { Tooltip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { useD2Definitions } from 'app/manifest/selectors';
import { timerDurationFromMsWithDecimal } from 'app/utils/time';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { StatHashes } from 'data/d2/generated-enums';
import { JSX } from 'react';
import { useSelector } from 'react-redux';
import * as styles from './ClarityCharacterStat.m.scss';

const statHashToClarityName: { [key: number]: keyof ClarityCharacterStats } = {
  [StatHashes.Weapons]: 'Mobility',
  [StatHashes.Health]: 'Resilience',
  [StatHashes.Class]: 'Recovery',
  [StatHashes.Super]: 'Intellect',
  [StatHashes.Grenade]: 'Discipline',
  [StatHashes.Melee]: 'Strength',
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
  const clarityStatData = clarityCharacterStats?.[statHashToClarityName[statHash]];

  if (!clarityStatData) {
    return null;
  }

  const abilityCooldowns: {
    cooldowns: number[];
    item: DestinyInventoryItemDefinition;
    overrides: DestinyInventoryItemDefinition[];
  }[] = [];

  const applicableOverrides = clarityStatData.Overrides.filter((o) => equippedHashes.has(o.Hash));
  const abilitiesList =
    'SuperAbilities' in clarityStatData
      ? clarityStatData.SuperAbilities
      : clarityStatData.Abilities;
  for (const a of abilitiesList) {
    if (!equippedHashes.has(a.Hash)) {
      continue;
    }
    let cooldowns = a.Cooldowns;
    const item = defs.InventoryItem.get(a.Hash);

    const overrides = [];

    // Apply cooldown overrides based on equipped items.
    for (const o of applicableOverrides) {
      const abilityIndex = (() => {
        const abilityIndex = o.Requirements.indexOf(a.Hash);
        if (abilityIndex !== -1) {
          return abilityIndex;
        }
        const subclassIdx = o.Requirements.findIndex((r) => r < 0 && equippedHashes.has(-r));
        if (subclassIdx !== -1) {
          return subclassIdx;
        }
        if (o.Requirements.length === 1 && o.Requirements[0] === 0) {
          return 0;
        }
        return -1;
      })();
      if (abilityIndex !== -1) {
        if (o.CooldownOverride?.some((v) => v > 0)) {
          cooldowns = o.CooldownOverride;
        }
        const scalar = o.Scalar?.[abilityIndex];
        if (scalar) {
          cooldowns = cooldowns.map((v) => scalar * v);
        }
        overrides.push(defs.InventoryItem.get(o.Hash));
      }
    }

    cooldowns = cooldowns.map((c) => Math.round(c));
    abilityCooldowns.push({ cooldowns, item, overrides });
  }

  // Cooldowns that are not about some specific ability
  const intrinsicCooldowns: JSX.Element[] = [];
  if ('TotalRegenTime' in clarityStatData) {
    intrinsicCooldowns.push(
      <StatTableRow
        key="TimeToFullHP"
        name={t('Stats.TimeToFullHP')}
        cooldowns={clarityStatData.TotalRegenTime.Array}
        tier={tier}
        unit="s"
      />,
    );
  } else if ('WalkSpeed' in clarityStatData) {
    intrinsicCooldowns.push(
      <StatTableRow
        key="WalkingSpeed"
        name={t('Stats.WalkingSpeed')}
        cooldowns={clarityStatData.WalkSpeed.Array}
        tier={tier}
        unit={t('Stats.MetersPerSecond')}
      />,
      <StatTableRow
        key="StrafingSpeed"
        name={t('Stats.StrafingSpeed')}
        cooldowns={clarityStatData.StrafeSpeed.Array}
        tier={tier}
        unit={t('Stats.MetersPerSecond')}
      />,
      <StatTableRow
        key="CrouchingSpeed"
        name={t('Stats.CrouchingSpeed')}
        cooldowns={clarityStatData.CrouchSpeed.Array}
        tier={tier}
        unit={t('Stats.MetersPerSecond')}
      />,
    );
  } else if ('ShieldHP' in clarityStatData) {
    intrinsicCooldowns.push(
      <StatTableRow
        key="ShieldHP"
        // t('Stats.TotalHP')
        // keep this around maybe?
        name={t('Stats.ShieldHP')}
        cooldowns={clarityStatData.ShieldHP.Array}
        tier={tier}
        unit={t('Stats.HP')}
      />,
      <StatTableRow
        key="DamageResistance"
        name={t('Stats.DamageResistance')}
        cooldowns={clarityStatData.PvEDamageResistance.Array}
        tier={tier}
        unit={t('Stats.Percentage')}
      />,
      <StatTableRow
        key="FlinchResistance"
        name={t('Stats.FlinchResistance')}
        cooldowns={clarityStatData.FlinchResistance.Array}
        tier={tier}
        unit={t('Stats.Percentage')}
      />,
    );
  }

  if (intrinsicCooldowns.length + abilityCooldowns.length === 0) {
    return null;
  }

  return (
    <Tooltip.Section className={styles.communityInsightSection}>
      <h3>{t('MovePopup.CommunityData')}</h3>
      <table>
        <thead>
          <tr>
            <th />
            {tier - 1 >= 0 && (
              <>
                <th colSpan={2} className={styles.value}>
                  {t('LoadoutBuilder.TierNumber', { tier: tier - 1 })}
                </th>
              </>
            )}
            <th colSpan={2} className={clsx(styles.value, styles.currentColumn)}>
              {t('LoadoutBuilder.TierNumber', { tier })}
            </th>
            {tier + 1 <= 10 && (
              <>
                <th colSpan={2} className={styles.value}>
                  {t('LoadoutBuilder.TierNumber', { tier: tier + 1 })}
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {abilityCooldowns
            .sort((a, b) => a.cooldowns[tier] - b.cooldowns[tier])
            .map(({ cooldowns, item, overrides }) => (
              <StatTableRow
                key={item.hash}
                name={item.displayProperties.name}
                icon={item.displayProperties.icon}
                cooldowns={cooldowns}
                tier={tier}
                overrides={overrides}
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
  overrides = [],
}: {
  name: string;
  icon?: string;
  unit: string;
  tier: number;
  cooldowns: number[];
  overrides?: DestinyInventoryItemDefinition[];
}) {
  const unitEl = <td className={styles.unit}>{unit}</td>;
  const seconds = unit === 's';

  const formatValue = (val: number) => {
    if (seconds) {
      return timerDurationFromMsWithDecimal(val * 1000);
    }
    return val.toLocaleString();
  };

  const colspan = seconds ? 2 : 1;

  return (
    <tr>
      <th>
        <span>
          {icon && <BungieImage src={icon} height={16} width={16} />}
          {name}
        </span>
        {overrides.map((o) => (
          <span key={o.hash} className={styles.override}>
            {'+ '}
            {o.displayProperties.icon && (
              <BungieImage src={o.displayProperties.icon} height={12} width={12} />
            )}
            {o.displayProperties.name}
          </span>
        ))}
      </th>
      {tier - 1 >= 0 && (
        <>
          <td className={styles.value} colSpan={colspan}>
            {formatValue(cooldowns[tier - 1])}
          </td>
          {!seconds && unitEl}
        </>
      )}
      <td className={clsx(styles.value, styles.currentColumn)} colSpan={colspan}>
        {formatValue(cooldowns[tier])}
      </td>
      {!seconds && <td className={clsx(styles.unit, styles.currentColumn)}>{unit}</td>}
      {tier + 1 <= 10 && (
        <>
          <td className={styles.value} colSpan={colspan}>
            {formatValue(cooldowns[tier + 1])}
          </td>
          {!seconds && unitEl}
        </>
      )}
    </tr>
  );
}
