import React from 'react';
import BungieImage from 'app/dim-ui/BungieImage';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { RootState } from 'app/store/reducers';
import { connect } from 'react-redux';
import styles from './CustomStatTotal.m.scss';
import { armorStats } from 'app/inventory/store/stats';
import { DestinyStatDefinition, DestinyClass } from 'bungie-api-ts/destiny2';
import { setSetting } from '../settings/actions';
import clsx from 'clsx';
import { settingsSelector } from 'app/settings/reducer';

export interface KeyedStatHashLists {
  [key: number]: number[];
}
interface ProvidedProps {
  forClass?: DestinyClass;
  readOnly?: boolean;
}
interface StoreProps {
  defs: D2ManifestDefinitions;
  customTotalStatsByClass: KeyedStatHashLists;
}

const mapDispatchToProps = {
  setSetting
};
type DispatchProps = typeof mapDispatchToProps;

type ToggleProps = ProvidedProps & StoreProps & DispatchProps;

function mapStateToProps() {
  return (state: RootState): StoreProps => ({
    defs: state.manifest.d2Manifest!,
    customTotalStatsByClass: settingsSelector(state).customTotalStatsByClass
  });
}

function StatTotalTogglePreConnect({
  forClass = DestinyClass.Unknown,
  readOnly = false,
  defs,
  customTotalStatsByClass,
  setSetting
}: ToggleProps) {
  const activeStats = customTotalStatsByClass[forClass]?.length
    ? customTotalStatsByClass[forClass]
    : [];

  return (
    <div>
      {addDividers(
        [
          { className: 'activeStatLabels', includesCheck: true },
          { className: 'inactiveStatLabels', includesCheck: false }
        ].map(({ className, includesCheck }) => (
          <span
            key={className}
            className={clsx(styles[className], { [styles.readOnly]: readOnly })}
          >
            {addDividers(
              armorStats
                .filter((statHash) => activeStats.includes(statHash) === includesCheck)
                .map((statHash) => (
                  <StatToggleButton
                    key={statHash}
                    stat={defs.Stat.get(statHash)}
                    setSetting={setSetting}
                    currentSettings={customTotalStatsByClass}
                    currentClass={forClass}
                    readOnly={readOnly}
                  />
                )),
              <span className={styles.divider} />
            )}
          </span>
        )),
        <span className={styles.divider} />
      )}
    </div>
  );
}

export const StatTotalToggle = connect<StoreProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(StatTotalTogglePreConnect);

/**
 * this check shouldn't be necessary :|
 * maybe it isn't if we're just hardcoding armor stats
 */
function StatToggleButton({
  stat,
  setSetting,
  currentSettings,
  currentClass,
  readOnly = false
}: {
  stat: DestinyStatDefinition;
  setSetting: DispatchProps['setSetting'];
  currentSettings: KeyedStatHashLists;
  currentClass: DestinyClass;
  readOnly: boolean;
}) {
  return (
    <span
      onClick={
        !readOnly
          ? (e) => {
              e.stopPropagation();
              setSetting('customTotalStatsByClass', {
                ...currentSettings,
                ...{
                  [currentClass]: toggleArrayElement(
                    stat.hash,
                    currentSettings[currentClass] ?? armorStats
                  )
                }
              });
            }
          : undefined
      }
    >
      {stat.displayProperties.hasIcon ? (
        <BungieImage
          title={stat.displayProperties.name}
          className={styles.inlineStatIcon}
          src={stat.displayProperties.icon}
        />
      ) : (
        stat.displayProperties.name
      )}
    </span>
  );
}

/** adds missing, or removes existing, @element in @arr */
function toggleArrayElement<T>(element: T, arr: T[]) {
  return arr.includes(element) ? arr.filter((v) => v !== element) : arr.concat(element);
}

/** places a @divider between each element of @arr */
function addDividers<T, U>(arr: T[], divider: U): (T | U)[] {
  return arr
    .map((e) => [e, divider])
    .flat()
    .slice(0, -1);
}
