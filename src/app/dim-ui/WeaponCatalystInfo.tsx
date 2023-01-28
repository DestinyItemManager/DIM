import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import Objective from 'app/progress/Objective';
import styles from './WeaponCatalystInfo.m.scss';

/**
 * A progress bar that shows a weapon's catalyst progress.
 *
 * This can be multiple objectives and there's an individual progress for each.
 */
export function WeaponCatalystInfo({ item }: { item: DimItem }) {
  const { catalystInfo } = item;

  if (!catalystInfo?.unlocked || catalystInfo.complete || !catalystInfo.objectives?.length) {
    return null;
  }

  return (
    <div className={styles.catalystProgress}>
      <span className={styles.catalystProgressTitle}>{t('MovePopup.CatalystProgress')}</span>
      <div className={styles.catalystProgressSection}>
        {catalystInfo.objectives.map((objective) => (
          <Objective key={objective.objectiveHash} objective={objective} />
        ))}
      </div>
    </div>
  );
}
