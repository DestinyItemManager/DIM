import styles from 'app/active-mode/Views/PursuitsView.m.scss';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import { t } from 'app/i18next-t';
import { DimStore } from 'app/inventory/store-types';
import { findItemsByBucket } from 'app/inventory/stores-helpers';
import { useD2Definitions } from 'app/manifest/selectors';
import Pursuit from 'app/progress/Pursuit';
import { sortPursuits } from 'app/progress/Pursuits';
import { TrackedTriumphs } from 'app/progress/TrackedTriumphs';
import { BucketHashes, ItemCategoryHashes } from 'data/d2/generated-enums';
import React from 'react';

interface Props {
  store: DimStore;
}

export default function PursuitsView({ store }: Props) {
  const defs = useD2Definitions();

  // Get all items in this character's inventory that represent quests - some are actual items that take
  // up inventory space, others are in the "Progress" bucket and need to be separated from the quest items
  // that represent milestones.
  const filteredItems = findItemsByBucket(store, BucketHashes.Quests);

  const pursuits = filteredItems.filter((item) => {
    const itemDef = defs?.InventoryItem.get(item.hash);
    if (
      item.itemCategoryHashes.includes(ItemCategoryHashes.QuestStep) ||
      itemDef?.objectives?.questlineItemHash
    ) {
      return item.tracked;
    }
    if (!item.objectives || item.objectives.length === 0 || item.sockets) {
      return false;
    }

    return true;
  });

  const trackingQuests = pursuits.some((item) => item.tracked);

  return (
    <CollapsibleTitle
      title={t('ActiveMode.Pursuits')}
      sectionId={'active-pursuits'}
      className={styles.collapseTitle}
      defaultCollapsed={true}
    >
      <div className={styles.activePursuits}>
        {pursuits.sort(sortPursuits).map((item) => (
          <Pursuit item={item} key={item.index} hideDescription={true} />
        ))}
        <ErrorBoundary name={t('Progress.TrackedTriumphs')}>
          <TrackedTriumphs hideRecordIcon={true} />
        </ErrorBoundary>
        {!trackingQuests && (
          <div className={styles.noQuests}>
            <div className={styles.message}>{t('ActiveMode.NoQuests')}</div>
          </div>
        )}
      </div>
    </CollapsibleTitle>
  );
}
