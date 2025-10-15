import { t } from 'app/i18next-t';
import { BucketSortType, InventoryBuckets } from 'app/inventory/inventory-buckets';
import clsx from 'clsx';
import * as styles from './CategoryStrip.m.scss';

/**
 * The selector at the bottom of the mobile interface that allows us to select weapons, armor, etc.
 */
export default function CategoryStrip({
  buckets,
  category: selectedCategoryId,
  onCategorySelected,
}: {
  buckets: InventoryBuckets;
  category: string;
  onCategorySelected: (category: string) => void;
}) {
  return (
    <div className={styles.options}>
      {Object.keys(buckets.byCategory).map(
        (category) =>
          category !== 'Postmaster' && (
            <div
              key={category}
              onClick={() => onCategorySelected(category)}
              className={clsx({ [styles.selected]: category === selectedCategoryId })}
            >
              {t(`Bucket.${category as BucketSortType}`, { metadata: { keys: 'buckets' } })}
            </div>
          ),
      )}
    </div>
  );
}
