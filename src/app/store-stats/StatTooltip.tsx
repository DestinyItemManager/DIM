import { ClarityCharacterStats } from 'app/clarity/descriptions/character-stats';
import { clarityCharacterStatsSelector } from 'app/clarity/selectors';
import { settingSelector } from 'app/dim-api/selectors';
import { Tooltip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { DimCharacterStatChange } from 'app/inventory/store-types';
import { statTier } from 'app/loadout-builder/utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { DestinyClass } from 'bungie-api-ts/destiny2';
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

function getClass(type: DestinyClass) {
  switch (type) {
    case DestinyClass.Titan:
      return 'titan';
    case DestinyClass.Hunter:
      return 'hunter';
    case DestinyClass.Warlock:
      return 'warlock';
    case DestinyClass.Unknown:
      return 'unknown';
    case DestinyClass.Classified:
      return 'classified';
  }
}

/**
 * A rich tooltip for character-level stats like Mobility, Intellect, etc.
 */
function StatTooltip({ stat, classType }: { stat: Stat; classType: DestinyClass }) {
  const tier = statTier(stat.value);
  const clarityCharacterStats = useSelector(clarityCharacterStatsSelector);
  const descriptionsToDisplay = useSelector(settingSelector('descriptionsToDisplay'));
  const useClarityInfo = descriptionsToDisplay !== 'bungie';
  const defs = useD2Definitions()!;

  const clarityStatData = clarityCharacterStats?.[statHashToClarityName[stat.hash]];

  const consolidated: { [cooldown: number]: Set<string> } = {};
  if (clarityStatData) {
    for (const a of clarityStatData.Abilities) {
      const abilityDef = defs.InventoryItem.get(a.Hash);

      if (
        [getClass(classType), 'shared'].some((prefix) =>
          abilityDef.plug?.plugCategoryIdentifier.startsWith(prefix + '.')
        )
      ) {
        const cooldown = a.Cooldowns[tier];
        const name = defs.InventoryItem.get(a.Hash)?.displayProperties.name;
        (consolidated[cooldown] ??= new Set()).add(name);
      }
    }
  }

  console.log({ useClarityInfo, clarityCharacterStats, clarityStatData, consolidated });

  // TODO: group effects by time?
  // TODO: filter by class type
  // TODO: graph?

  // TODO: include icons?
  // TODO: remove common words?
  // TODO: styling

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
      {!_.isEmpty(consolidated) && (
        <>
          <hr />
          <table>
            <tbody>
              {Object.keys(consolidated)
                .sort((a, b) => Number(a) - Number(b))
                .map((cooldown) => (
                  <tr key={cooldown}>
                    <td>{cooldown}s:</td>
                    <td>{[...consolidated[Number(cooldown)]].sort().join(', ')}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default StatTooltip;
