import React from 'react';
// import { DimItem } from 'app/inventory/item-types';
import BungieImage from 'app/dim-ui/BungieImage';
// import { getSpecialtySocket } from 'app/utils/item-utils';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { RootState } from 'app/store/reducers';
import { connect } from 'react-redux';
import styles from './CustomStatTotal.m.scss';
import { armorStats } from 'app/inventory/store/stats';
import { DestinyStatDefinition } from 'bungie-api-ts/destiny2';

interface ProvidedProps {
  guardianClass?: string;
}
interface StoreProps {
  defs: D2ManifestDefinitions;
}
function mapStateToProps() {
  return (state: RootState): StoreProps => ({
    defs: state.manifest.d2Manifest!
  });
}
type Props = ProvidedProps & StoreProps;

export const activeStats = [2996146975, 1943323491];

function StatTotalToggle({ guardianClass, defs }: Props) {
  guardianClass && guardianClass.split('');
  const activeStatLabels = armorStats
    .filter((statHash) => activeStats.includes(statHash))
    .map((statHash) => statIconOrName(defs.Stat.get(statHash)));
  const inactiveStatLabels = armorStats
    .filter((statHash) => !activeStats.includes(statHash))
    .map((statHash) => statIconOrName(defs.Stat.get(statHash)));
  return (
    <div>
      <span className={styles.activeStats}>{activeStatLabels}</span>
      <span className={styles.inactiveStats}>{inactiveStatLabels}</span>
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(StatTotalToggle);

/**
 * this shouldn't be necessary :|
 * maybe it isn't.
 */
function statIconOrName(stat: DestinyStatDefinition) {
  return (
    <span>
      {stat.displayProperties.hasIcon ? (
        <BungieImage className={styles.inlineStatIcon} src={stat.displayProperties.icon} />
      ) : (
        stat.displayProperties.name
      )}
    </span>
  );
}

// /** places a @divider between each element of @arr */
// function addDividers<T, U>(arr: T[], divider: U): (T | U)[] {
//   return arr
//     .map((e) => [e, divider])
//     .flat()
//     .slice(0, -1);
// }
