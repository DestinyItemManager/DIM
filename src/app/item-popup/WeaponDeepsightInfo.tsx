import { DimItem } from 'app/inventory/item-types';
import { isHarmonizable } from 'app/inventory/store/deepsight';
import Objective, { ObjectiveCheckbox } from 'app/progress/Objective';
import { DeepsightHarmonizerIcon } from './DeepsightHarmonizerIcon';
import * as styles from './WeaponDeepsightInfo.m.scss';
/**
 * A progress bar that shows a weapon's crafting pattern progress.
 */
export function WeaponDeepsightInfo({ item }: { item: DimItem }) {
  const record = item.patternUnlockRecord;
  const relevantObjectives = record?.objectives.filter((o) => !o.complete);

  if (!relevantObjectives?.length) {
    return null;
  }

  return (
    <div className={styles.deepsightProgress}>
      {relevantObjectives && relevantObjectives.length > 0 && (
        <>
          {isHarmonizable(item) ? (
            <DeepsightHarmonizerIcon item={item} />
          ) : (
            <ObjectiveCheckbox completed={false} />
          )}
          <div className={styles.deepsightProgressBar}>
            {relevantObjectives.map((objective) => (
              <Objective
                key={objective.objectiveHash}
                objective={objective}
                showHidden
                noCheckbox
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
