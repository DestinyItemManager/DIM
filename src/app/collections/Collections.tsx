import { trackedTriumphsSelector } from 'app/dim-api/selectors';
import CheckButton from 'app/dim-ui/CheckButton';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { TrackedTriumphs } from 'app/progress/TrackedTriumphs';
import { searchFilterSelector } from 'app/search/search-filter';
import { setSetting } from 'app/settings/actions';
import { settingsSelector } from 'app/settings/reducer';
import { querySelector } from 'app/shell/reducer';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { useSubscription } from 'app/utils/hooks';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router';
import { createSelector } from 'reselect';
import { DestinyAccount } from '../accounts/destiny-account';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import { D2StoresService } from '../inventory/d2-stores';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import {
  bucketsSelector,
  isPhonePortraitSelector,
  profileResponseSelector,
  storesSelector,
} from '../inventory/selectors';
import { refresh$ } from '../shell/refresh';
import Catalysts from './Catalysts';
import './collections.scss';
import PresentationNodeRoot from './PresentationNodeRoot';

interface ProvidedProps {
  account: DestinyAccount;
}

interface StoreProps {
  buckets?: InventoryBuckets;
  defs?: D2ManifestDefinitions;
  ownedItemHashes: Set<number>;
  profileResponse?: DestinyProfileResponse;
  searchQuery?: string;
  isPhonePortrait: boolean;
  trackedTriumphs: number[];
  completedRecordsHidden: boolean;
  redactedRecordsRevealed: boolean;
  searchFilter?(item: DimItem): boolean;
}

type Props = ProvidedProps & StoreProps & ThunkDispatchProp;

function mapStateToProps() {
  const ownedItemHashesSelector = createSelector(storesSelector, (stores) => {
    const ownedItemHashes = new Set<number>();
    if (stores) {
      for (const store of stores) {
        for (const item of store.items) {
          ownedItemHashes.add(item.hash);
        }
      }
    }
    return ownedItemHashes;
  });

  return (state: RootState): StoreProps => {
    const settings = settingsSelector(state);
    return {
      buckets: bucketsSelector(state),
      defs: state.manifest.d2Manifest,
      ownedItemHashes: ownedItemHashesSelector(state),
      profileResponse: profileResponseSelector(state),
      searchQuery: querySelector(state),
      searchFilter: searchFilterSelector(state),
      isPhonePortrait: isPhonePortraitSelector(state),
      trackedTriumphs: trackedTriumphsSelector(state),
      completedRecordsHidden: settings.completedRecordsHidden,
      redactedRecordsRevealed: settings.redactedRecordsRevealed,
    };
  };
}

const refreshStores = () =>
  refresh$.subscribe(() => {
    D2StoresService.reloadStores();
  });

/**
 * The collections screen that shows items you can get back from the vault, like emblems and exotics.
 */
function Collections({
  account,
  buckets,
  ownedItemHashes,
  defs,
  profileResponse,
  searchQuery,
  searchFilter,
  isPhonePortrait,
  trackedTriumphs,
  completedRecordsHidden,
  redactedRecordsRevealed,
  dispatch,
}: Props) {
  useEffect(() => {
    D2StoresService.getStoresStream(account);
  }, [account]);

  useSubscription(refreshStores);

  const { presentationNodeHashStr } = useParams<{ presentationNodeHashStr: string }>();
  const presentationNodeHash = presentationNodeHashStr
    ? parseInt(presentationNodeHashStr, 10)
    : undefined;

  if (!profileResponse || !defs || !buckets) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  const badgesRootNodeHash =
    profileResponse.profileCollectibles?.data?.collectionBadgesRootNodeHash;
  const metricsRootNodeHash = profileResponse.metrics?.data?.metricsRootNodeHash;
  const collectionsRootHash =
    profileResponse.profileCollectibles.data?.collectionCategoriesRootNodeHash;
  const recordsRootHash = profileResponse.profileRecords.data?.recordCategoriesRootNodeHash;
  const sealsRootHash = profileResponse.profileRecords.data?.recordSealsRootNodeHash;

  const badgesTitle =
    badgesRootNodeHash && defs.PresentationNode.get(badgesRootNodeHash).displayProperties.name;
  const triumphTitle =
    recordsRootHash && defs.PresentationNode.get(recordsRootHash).displayProperties.name;
  const sealsTitle =
    sealsRootHash && defs.PresentationNode.get(sealsRootHash).displayProperties.name;

  const trackedRecordHash = profileResponse?.profileRecords?.data?.trackedRecordHash || 0;

  const menuItems = [
    { id: 'trackedTriumphs', title: t('Progress.TrackedTriumphs') },
    { id: 'catalysts', title: t('Vendors.Catalysts') },
    { id: 'triumphs', title: triumphTitle },
    { id: 'seals', title: sealsTitle },
    { id: 'collections', title: t('Vendors.Collections') },
    { id: 'badges', title: badgesTitle },
    { id: 'metrics', title: t('Progress.StatTrackers') },
  ];

  const onToggleCompletedRecordsHidden = (checked: boolean) =>
    dispatch(setSetting('completedRecordsHidden', checked));
  const onToggleRedactedRecordsRevealed = (checked: boolean) =>
    dispatch(setSetting('redactedRecordsRevealed', checked));

  return (
    <PageWithMenu className="d2-vendors">
      <PageWithMenu.Menu>
        {!isPhonePortrait && (
          <div className="progress-menu">
            {menuItems.map((menuItem) => (
              <PageWithMenu.MenuButton key={menuItem.id} anchor={menuItem.id}>
                <span>{menuItem.title}</span>
              </PageWithMenu.MenuButton>
            ))}
          </div>
        )}
        <div className="presentationNodeOptions">
          <CheckButton checked={completedRecordsHidden} onChange={onToggleCompletedRecordsHidden}>
            {t('Triumphs.HideCompleted')}
          </CheckButton>
          <CheckButton checked={redactedRecordsRevealed} onChange={onToggleRedactedRecordsRevealed}>
            {t('Triumphs.RevealRedacted')}
          </CheckButton>
        </div>
      </PageWithMenu.Menu>

      <PageWithMenu.Contents className="collections-page">
        <section id="trackedTriumphs">
          <CollapsibleTitle title={t('Progress.TrackedTriumphs')} sectionId="trackedTriumphs">
            <ErrorBoundary name={t('Progress.TrackedTriumphs')}>
              <TrackedTriumphs
                trackedTriumphs={trackedTriumphs}
                trackedRecordHash={trackedRecordHash}
                defs={defs}
                profileResponse={profileResponse}
                searchQuery={searchQuery}
              />
            </ErrorBoundary>
          </CollapsibleTitle>
        </section>
        {!searchQuery && (
          <section id="catalysts">
            <CollapsibleTitle title={t('Vendors.Catalysts')} sectionId="catalysts">
              <ErrorBoundary name="Catalysts">
                <Catalysts defs={defs} profileResponse={profileResponse} />
              </ErrorBoundary>
            </CollapsibleTitle>
          </section>
        )}
        {recordsRootHash && (
          <section id="triumphs">
            <CollapsibleTitle title={triumphTitle} sectionId="triumphs">
              <ErrorBoundary name="Triumphs">
                <PresentationNodeRoot
                  presentationNodeHash={recordsRootHash}
                  defs={defs}
                  profileResponse={profileResponse}
                  isTriumphs={true}
                  searchQuery={searchQuery}
                  searchFilter={searchFilter}
                  completedRecordsHidden={completedRecordsHidden}
                />
              </ErrorBoundary>
            </CollapsibleTitle>
          </section>
        )}

        {sealsRootHash && (
          <section id="seals">
            <CollapsibleTitle title={sealsTitle} sectionId="seals">
              <ErrorBoundary name="Seals">
                <PresentationNodeRoot
                  presentationNodeHash={sealsRootHash}
                  defs={defs}
                  profileResponse={profileResponse}
                  searchQuery={searchQuery}
                  searchFilter={searchFilter}
                  completedRecordsHidden={completedRecordsHidden}
                />
              </ErrorBoundary>
            </CollapsibleTitle>
          </section>
        )}
        {collectionsRootHash && (
          <section id="collections">
            <CollapsibleTitle title={t('Vendors.Collections')} sectionId="collections">
              <ErrorBoundary name={t('Vendors.Collections')}>
                <PresentationNodeRoot
                  presentationNodeHash={collectionsRootHash}
                  defs={defs}
                  profileResponse={profileResponse}
                  buckets={buckets}
                  ownedItemHashes={ownedItemHashes}
                  openedPresentationHash={presentationNodeHash}
                  showPlugSets={true}
                  searchQuery={searchQuery}
                  searchFilter={searchFilter}
                  overrideName={t('Vendors.Collections')}
                />
              </ErrorBoundary>
            </CollapsibleTitle>
          </section>
        )}
        {badgesRootNodeHash && (
          <section id="badges">
            <CollapsibleTitle title={badgesTitle} sectionId="badges">
              <ErrorBoundary name="Badges">
                <PresentationNodeRoot
                  presentationNodeHash={badgesRootNodeHash}
                  defs={defs}
                  profileResponse={profileResponse}
                  buckets={buckets}
                  ownedItemHashes={ownedItemHashes}
                  openedPresentationHash={presentationNodeHash}
                  searchQuery={searchQuery}
                  searchFilter={searchFilter}
                />
              </ErrorBoundary>
            </CollapsibleTitle>
          </section>
        )}
        {metricsRootNodeHash && (
          <section id="metrics">
            <CollapsibleTitle title={t('Progress.StatTrackers')} sectionId="metrics">
              <ErrorBoundary name={t('Progress.StatTrackers')}>
                <PresentationNodeRoot
                  presentationNodeHash={metricsRootNodeHash}
                  defs={defs}
                  profileResponse={profileResponse}
                  buckets={buckets}
                  ownedItemHashes={ownedItemHashes}
                  openedPresentationHash={presentationNodeHash}
                  searchQuery={searchQuery}
                  searchFilter={searchFilter}
                  overrideName={t('Progress.StatTrackers')}
                />
              </ErrorBoundary>
            </CollapsibleTitle>
          </section>
        )}
      </PageWithMenu.Contents>
    </PageWithMenu>
  );
}

export default connect<StoreProps>(mapStateToProps)(Collections);
