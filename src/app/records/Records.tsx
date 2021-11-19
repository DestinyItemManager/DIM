import { settingsSelector } from 'app/dim-api/selectors';
import CheckButton from 'app/dim-ui/CheckButton';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { useLoadStores } from 'app/inventory/store/hooks';
import { destiny2CoreSettingsSelector, useD2Definitions } from 'app/manifest/selectors';
import { TrackedTriumphs } from 'app/progress/TrackedTriumphs';
import { ItemFilter } from 'app/search/filter-types';
import { searchFilterSelector } from 'app/search/search-filter';
import { useSetSetting } from 'app/settings/hooks';
import { querySelector, useIsPhonePortrait } from 'app/shell/selectors';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { Destiny2CoreSettings } from 'bungie-api-ts/core';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { DestinyAccount } from '../accounts/destiny-account';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import {
  bucketsSelector,
  ownedItemsSelector,
  profileResponseSelector,
} from '../inventory/selectors';
import './collections.scss';
import PresentationNodeRoot from './PresentationNodeRoot';

interface ProvidedProps {
  account: DestinyAccount;
}

interface StoreProps {
  buckets?: InventoryBuckets;
  ownedItemHashes: Set<number>;
  profileResponse?: DestinyProfileResponse;
  searchQuery?: string;
  completedRecordsHidden: boolean;
  redactedRecordsRevealed: boolean;
  searchFilter?: ItemFilter;
  destiny2CoreSettings?: Destiny2CoreSettings;
}

type Props = ProvidedProps & StoreProps & ThunkDispatchProp;

function mapStateToProps() {
  return (state: RootState): StoreProps => {
    const settings = settingsSelector(state);
    return {
      buckets: bucketsSelector(state),
      ownedItemHashes: ownedItemsSelector(state),
      profileResponse: profileResponseSelector(state),
      searchQuery: querySelector(state),
      searchFilter: searchFilterSelector(state),
      completedRecordsHidden: settings.completedRecordsHidden,
      redactedRecordsRevealed: settings.redactedRecordsRevealed,
      destiny2CoreSettings: destiny2CoreSettingsSelector(state),
    };
  };
}

/**
 * The records screen shows account-wide things like Triumphs and Collections.
 */
function Records({
  account,
  buckets,
  ownedItemHashes,
  profileResponse,
  searchQuery,
  searchFilter,
  completedRecordsHidden,
  redactedRecordsRevealed,
  destiny2CoreSettings,
}: Props) {
  const isPhonePortrait = useIsPhonePortrait();
  useLoadStores(account);
  const setSetting = useSetSetting();
  const [searchParams] = useSearchParams();

  const presentationNodeHash = searchParams.has('presentationNodeHash')
    ? parseInt(searchParams.get('presentationNodeHash')!, 10)
    : undefined;

  const defs = useD2Definitions();

  if (!profileResponse || !defs || !buckets) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  // Some root nodes come from the profile
  const badgesRootNodeHash =
    profileResponse?.profileCollectibles?.data?.collectionBadgesRootNodeHash;
  const metricsRootNodeHash = profileResponse?.metrics?.data?.metricsRootNodeHash;
  const collectionsRootHash =
    profileResponse?.profileCollectibles?.data?.collectionCategoriesRootNodeHash;
  const recordsRootHash = profileResponse?.profileRecords?.data?.recordCategoriesRootNodeHash;
  const sealsRootHash = profileResponse?.profileRecords?.data?.recordSealsRootNodeHash;

  const seasonalChallengesHash = destiny2CoreSettings?.seasonalChallengesPresentationNodeHash || 0;

  const profileHashes = _.compact([
    seasonalChallengesHash,
    recordsRootHash,
    sealsRootHash,
    collectionsRootHash,
    badgesRootNodeHash,
    metricsRootNodeHash,
  ]);

  // Some nodes have bad titles, we manually fix them
  const overrideTitles: { [nodeHash: number]: string } = {};
  if (collectionsRootHash) {
    overrideTitles[collectionsRootHash] = t('Vendors.Collections');
  }
  if (metricsRootNodeHash) {
    overrideTitles[metricsRootNodeHash] = t('Progress.StatTrackers');
  }

  // We discover the rest of the root nodes from the Bungie.net core settings
  const otherHashes = destiny2CoreSettings
    ? Object.keys(destiny2CoreSettings)
        .filter((k) => k.includes('RootNode'))
        .map((k) => destiny2CoreSettings[k] as number)
        .filter((n) => !profileHashes.includes(n))
    : [];

  // We put the hashes we know about from profile first
  const nodeHashes = [...profileHashes, ...otherHashes];

  const menuItems = [
    { id: 'trackedTriumphs', title: t('Progress.TrackedTriumphs') },
    ...nodeHashes
      .map((h) => defs.PresentationNode.get(h))
      .map((nodeDef) => ({
        id: `p_${nodeDef.hash}`,
        title: overrideTitles[nodeDef.hash] || nodeDef.displayProperties.name,
      })),
  ];

  const onToggleCompletedRecordsHidden = (checked: boolean) =>
    setSetting('completedRecordsHidden', checked);
  const onToggleRedactedRecordsRevealed = (checked: boolean) =>
    setSetting('redactedRecordsRevealed', checked);

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
          <CheckButton
            name="hide-completed"
            checked={completedRecordsHidden}
            onChange={onToggleCompletedRecordsHidden}
          >
            {t('Triumphs.HideCompleted')}
          </CheckButton>
          <CheckButton
            name="reveal-redacted"
            checked={redactedRecordsRevealed}
            onChange={onToggleRedactedRecordsRevealed}
          >
            {t('Triumphs.RevealRedacted')}
          </CheckButton>
        </div>
      </PageWithMenu.Menu>

      <PageWithMenu.Contents className="collections-page">
        <section id="trackedTriumphs">
          <CollapsibleTitle title={t('Progress.TrackedTriumphs')} sectionId="trackedTriumphs">
            <ErrorBoundary name={t('Progress.TrackedTriumphs')}>
              <TrackedTriumphs searchQuery={searchQuery} />
            </ErrorBoundary>
          </CollapsibleTitle>
        </section>
        {nodeHashes
          .map((h) => defs.PresentationNode.get(h))
          .map((nodeDef) => (
            <section key={nodeDef.hash} id={`p_${nodeDef.hash}`}>
              <CollapsibleTitle
                title={overrideTitles[nodeDef.hash] || nodeDef.displayProperties.name}
                sectionId={`p_${nodeDef.hash}`}
              >
                <ErrorBoundary name={nodeDef.displayProperties.name}>
                  <PresentationNodeRoot
                    presentationNodeHash={nodeDef.hash}
                    profileResponse={profileResponse}
                    buckets={buckets}
                    ownedItemHashes={ownedItemHashes}
                    openedPresentationHash={presentationNodeHash}
                    searchQuery={searchQuery}
                    searchFilter={searchFilter}
                    overrideName={overrideTitles[nodeDef.hash]}
                    isTriumphs={nodeDef.hash === recordsRootHash}
                    showPlugSets={nodeDef.hash === collectionsRootHash}
                  />
                </ErrorBoundary>
              </CollapsibleTitle>
            </section>
          ))}
      </PageWithMenu.Contents>
    </PageWithMenu>
  );
}

export default connect<StoreProps>(mapStateToProps)(Records);
