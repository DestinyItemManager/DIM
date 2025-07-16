import { settingSelector } from 'app/dim-api/selectors';
import BungieImage from 'app/dim-ui/BungieImage';
import { useTooltipCustomization } from 'app/dim-ui/PressTip';
import { DimCharacterStat } from 'app/inventory/store-types';
import { statTier } from 'app/loadout-builder/utils';
import { edgeOfFateReleased, EFFECTIVE_MAX_STAT } from 'app/loadout/known-values';
import clsx from 'clsx';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import ClarityCharacterStat from './ClarityCharacterStat';
import styles from './StatTooltip.m.scss';

/**
 * A rich tooltip for character-level stats like Mobility, Intellect, etc.
 */
export default function StatTooltip({
  stat,
  equippedHashes,
}: {
  stat: DimCharacterStat;
  /**
   * Hashes of equipped/selected items and subclass plugs for this character or loadout. Can be limited to
   * exotic armor + subclass plugs - make sure to include default-selected subclass plugs.
   */
  equippedHashes: Set<number>;
}) {
  const descriptionsToDisplay = useSelector(settingSelector('descriptionsToDisplay'));
  const useClarityInfo = descriptionsToDisplay !== 'bungie' && !edgeOfFateReleased;
  useTooltipCustomization({
    getHeader: useCallback(
      () => (
        <div className={styles.title}>
          {stat.displayProperties.icon && <BungieImage src={stat.displayProperties.icon} />}
          <div>{stat.displayProperties.name}</div>
          <div className={styles.value}>{`${stat.value} / ${EFFECTIVE_MAX_STAT}`}</div>
        </div>
      ),
      [stat.displayProperties.name, stat.value, stat.displayProperties.icon],
    ),
  });

  return (
    <>
      <div>{stat.displayProperties.description}</div>
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
                    contribution.count !== undefined &&
                    contribution.count > 1 &&
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
        <ClarityCharacterStat
          statHash={stat.hash}
          tier={statTier(stat.value)}
          equippedHashes={equippedHashes}
        />
      )}
    </>
  );
}
