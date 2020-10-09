import styles from 'app/active-mode/Views/PursuitsView.m.scss';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { trackedTriumphsSelector } from 'app/dim-api/selectors';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import { t } from 'app/i18next-t';
import { profileResponseSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { findItemsByBucket } from 'app/inventory/stores-helpers';
import Pursuit from 'app/progress/Pursuit';
import { sortPursuits } from 'app/progress/Pursuits';
import { TrackedTriumphs } from 'app/progress/TrackedTriumphs';
import { RootState } from 'app/store/types';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import { BucketHashes, ItemCategoryHashes } from 'data/d2/generated-enums';
import React from 'react';
import { connect } from 'react-redux';

interface ProvidedProps {
  store: DimStore;
}

interface StoreProps {
  trackedTriumphs: number[];
  defs?: D2ManifestDefinitions;
  profileResponse?: DestinyProfileResponse;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    defs: state.manifest.d2Manifest,
    trackedTriumphs: trackedTriumphsSelector(state),
    profileResponse: profileResponseSelector(state),
  };
}

type Props = ProvidedProps & StoreProps;

function PursuitsView({ store, trackedTriumphs, defs, profileResponse }: Props) {
  // Get all items in this character's inventory that represent quests - some are actual items that take
  // up inventory space, others are in the "Progress" bucket and need to be separated from the quest items
  // that represent milestones.
  const filteredItems = findItemsByBucket(store, BucketHashes.Quests).concat(
    // Include prophecy tablets, which are in consumables
    findItemsByBucket(store, BucketHashes.Consumables).filter((item) =>
      item.itemCategoryHashes.includes(ItemCategoryHashes.ProphecyTablets)
    )
  );

  const pursuits = filteredItems.filter((item) => {
    const itemDef = defs?.InventoryItem.get(item.hash);
    if (
      item.itemCategoryHashes.includes(ItemCategoryHashes.QuestStep) ||
      item.itemCategoryHashes.includes(ItemCategoryHashes.ProphecyTablets) ||
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
  const trackedRecordHash = profileResponse?.profileRecords?.data?.trackedRecordHash || 0;

  return (
    <CollapsibleTitle
      title={t('ActiveMode.Pursuits')}
      sectionId={'active-pursuits'}
      defaultCollapsed={true}
    >
      <div className={styles.activePursuits}>
        {pursuits.sort(sortPursuits).map((item) => (
          <Pursuit item={item} key={item.index} defs={defs!} hideDescription={true} />
        ))}
        <ErrorBoundary name={t('Progress.TrackedTriumphs')}>
          <TrackedTriumphs
            trackedTriumphs={trackedTriumphs}
            trackedRecordHash={trackedRecordHash}
            defs={defs!}
            profileResponse={profileResponse!}
            hideRecordIcon={true}
          />
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

export default connect<StoreProps>(mapStateToProps)(PursuitsView);
