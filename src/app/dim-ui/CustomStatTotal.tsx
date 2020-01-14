import React from 'react';
// import { DimItem } from 'app/inventory/item-types';
import BungieImage from 'app/dim-ui/BungieImage';
// import { getSpecialtySocket } from 'app/utils/item-utils';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { RootState } from 'app/store/reducers';
import { connect } from 'react-redux';
import styles from './CustomStatTotal.m.scss';
import { armorStats } from 'app/inventory/store/stats';
import { DestinyStatDefinition, DestinyClass } from 'bungie-api-ts/destiny2';
import { setSetting } from '../settings/actions';
import { D2Item } from 'app/inventory/item-types';
import clsx from 'clsx';

interface ProvidedProps {
  characterClass?: DestinyClass;
  readOnly?: boolean;
}
interface StoreDefs {
  defs: D2ManifestDefinitions;
}
interface StoreStats {
  customTotalStats: { [key: string]: number[] };
}
type StoreDefsAndStats = StoreDefs & StoreStats;

const mapDispatchToProps = {
  setSetting
};
type DispatchProps = typeof mapDispatchToProps;

type ToggleProps = ProvidedProps & StoreDefsAndStats & DispatchProps;
type TotalProps = { item: D2Item } & ProvidedProps & StoreDefsAndStats;

function mapStateToProps() {
  return (state: RootState): StoreDefsAndStats => ({
    defs: state.manifest.d2Manifest!,
    customTotalStats: state.settings.customTotalStats
  });
}

function GetItemCustomTotalPreConnect({
  item,
  characterClass = DestinyClass.Unknown,
  customTotalStats
}: TotalProps) {
  const collectedStats =
    item.stats?.filter((s) => customTotalStats[characterClass]?.includes(s.statHash)) ?? [];

  return (
    <>
      {collectedStats.length === customTotalStats[characterClass]?.length &&
        collectedStats.reduce((a, b) => a + b.base, 0)}
    </>
  );
}

function StatTotalTogglePreConnect({
  characterClass = DestinyClass.Unknown,
  readOnly = false,
  defs,
  customTotalStats,
  setSetting
}: ToggleProps) {
  const activeStats = customTotalStats[characterClass]?.length
    ? customTotalStats[characterClass]
    : armorStats;

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
                    setter={setSetting}
                    currentSettings={customTotalStats}
                    currentClass={characterClass}
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

export const StatTotalToggle = connect<StoreDefsAndStats, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(StatTotalTogglePreConnect);

export const GetItemCustomTotal = connect<StoreDefsAndStats>(mapStateToProps)(
  GetItemCustomTotalPreConnect
);

/**
 * this check shouldn't be necessary :|
 * maybe it isn't if we're just hardcoding armor stats
 */
function StatToggleButton({
  stat,
  setter,
  currentSettings,
  currentClass,
  readOnly = false
}: {
  stat: DestinyStatDefinition;
  setter;
  currentSettings: { [key: string]: number[] };
  currentClass: DestinyClass;
  readOnly: boolean;
}) {
  return (
    <span
      onClick={
        !readOnly
          ? (e) => {
              e.stopPropagation();
              setter('customTotalStats', {
                ...currentSettings,
                ...{
                  [currentClass]: toggleArrayEntry(
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

function toggleArrayEntry<T>(entry: T, arr: T[]) {
  // console.log(arr);
  // console.log(arr.includes(entry) ? arr.filter((v) => v !== entry) : arr.concat(entry));
  return arr.includes(entry) ? arr.filter((v) => v !== entry) : arr.concat(entry);
}

/** places a @divider between each element of @arr */
function addDividers<T, U>(arr: T[], divider: U): (T | U)[] {
  return arr
    .map((e) => [e, divider])
    .flat()
    .slice(0, -1);
}
