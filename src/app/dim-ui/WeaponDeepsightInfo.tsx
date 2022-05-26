import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimItem } from 'app/inventory/item-types';
import { profileResponseSelector } from 'app/inventory/selectors';
import { d2ManifestSelector } from 'app/manifest/selectors';
import Objective from 'app/progress/Objective';
import { RootState } from 'app/store/types';
import { DestinyRecordToastStyle } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import styles from './WeaponDeepsightInfo.m.scss';

const getItemPatternRecordHash = _.memoize((defs: D2ManifestDefinitions, itemName: string) => {
  for (const record of Object.values(defs.Record.getAll())) {
    if (
      record.completionInfo?.toastStyle === DestinyRecordToastStyle.CraftingRecipeUnlocked &&
      record.displayProperties.name === itemName
    ) {
      return record.hash;
    }
  }
});

/**
 * A progress bar that shows a weapon's Deepsight Resonance attunement progress.
 */
export function WeaponDeepsightInfo({ item }: { item: DimItem }) {
  const deepsightInfo = item.deepsightInfo!;
  const record = useSelector((state: RootState) => {
    if (!deepsightInfo.extractPattern) {
      return undefined;
    }
    const defs = d2ManifestSelector(state)!;
    const profileResponse = profileResponseSelector(state);
    const recordHash = getItemPatternRecordHash(defs, item.name);
    return recordHash ? profileResponse?.profileRecords?.data?.records[recordHash] : undefined;
  });
  return (
    <div className={styles.deepsightProgress}>
      <Objective objective={deepsightInfo.attunementObjective} />
      {record?.objectives[0] && <Objective objective={record.objectives[0]} />}
    </div>
  );
}
