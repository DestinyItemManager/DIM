import BungieImage from 'app/dim-ui/BungieImage';
import { useD2Definitions } from 'app/manifest/selectors';
import { armorStats } from 'app/search/d2-known-values';
import { useSetting } from 'app/settings/hooks';
import { addDividers } from 'app/utils/react';
import { DestinyClass, DestinyStatDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import * as styles from './CustomStatTotal.m.scss';

export type StatHashListsKeyedByDestinyClass = Record<number, number[]>;

export function StatTotalToggle({
  forClass = DestinyClass.Unknown,
  readOnly = false,
  className,
}: {
  className?: string;
  forClass?: DestinyClass;
  readOnly?: boolean;
}) {
  const defs = useD2Definitions();
  const [customTotalStatsByClass, setCustomTotalStatsByClass] =
    useSetting('customTotalStatsByClass');

  const toggleStat = (statHash: number) => {
    setCustomTotalStatsByClass({
      ...customTotalStatsByClass,
      ...{
        [forClass]: toggleArrayElement(statHash, customTotalStatsByClass[forClass] ?? []),
      },
    });
  };

  const activeStats = customTotalStatsByClass[forClass]?.length
    ? customTotalStatsByClass[forClass]
    : [];

  if (!defs) {
    return null;
  }
  return (
    <div className={clsx(className)}>
      {addDividers(
        [
          { className: styles.activeStatLabels, includesCheck: true },
          { className: styles.inactiveStatLabels, includesCheck: false },
        ].map(({ className, includesCheck }) => (
          <span key={className} className={clsx(className, { [styles.readOnly]: readOnly })}>
            {addDividers(
              armorStats
                .filter((statHash) => activeStats.includes(statHash) === includesCheck)
                .map((statHash) => (
                  <StatToggleButton
                    key={statHash}
                    stat={defs.Stat.get(statHash)}
                    toggleStat={toggleStat}
                    readOnly={readOnly}
                  />
                )),
              <span className={styles.divider} />,
            )}
          </span>
        )),
        <span className={styles.divider} />,
      )}
    </div>
  );
}

/**
 * this check shouldn't be necessary :|
 * maybe it isn't if we're just hardcoding armor stats
 */
function StatToggleButton({
  stat,
  toggleStat,
  readOnly = false,
}: {
  stat: DestinyStatDefinition;
  toggleStat: (statHash: number) => void;
  readOnly: boolean;
}) {
  return (
    <span
      onClick={
        !readOnly
          ? (e) => {
              e.stopPropagation();
              toggleStat(stat.hash);
            }
          : undefined
      }
      role="button"
    >
      {stat.displayProperties.hasIcon ? (
        <span title={stat.displayProperties.name} className={styles.inlineStatIcon}>
          <BungieImage src={stat.displayProperties.icon} />
        </span>
      ) : (
        stat.displayProperties.name
      )}
    </span>
  );
}

/** adds missing, or removes existing, element in arr */
function toggleArrayElement<T>(element: T, arr: T[]) {
  return arr.includes(element) ? arr.filter((v) => v !== element) : arr.concat(element);
}
