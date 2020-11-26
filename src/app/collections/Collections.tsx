import { settingsSelector, trackedTriumphsSelector } from 'app/dim-api/selectors';
import CheckButton from 'app/dim-ui/CheckButton';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { useLoadStores } from 'app/inventory/store/hooks';
import { destiny2CoreSettingsSelector } from 'app/manifest/selectors';
import { TrackedTriumphs } from 'app/progress/TrackedTriumphs';
import { ItemFilter } from 'app/search/filter-types';
import { searchFilterSelector } from 'app/search/search-filter';
import { setSetting } from 'app/settings/actions';
import { isPhonePortraitSelector, querySelector } from 'app/shell/selectors';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { Destiny2CoreSettings } from 'bungie-api-ts/core';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router';
import { DestinyAccount } from '../accounts/destiny-account';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
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
  defs?: D2ManifestDefinitions;
  ownedItemHashes: Set<number>;
  profileResponse?: DestinyProfileResponse;
  searchQuery?: string;
  isPhonePortrait: boolean;
  trackedTriumphs: number[];
  completedRecordsHidden: boolean;
  redactedRecordsRevealed: boolean;
  searchFilter?: ItemFilter;
  destiny2CoreSettings?: Destiny2CoreSettings;
}

type Props = ProvidedProps & StoreProps & ThunkDispatchProp;

function mapStateToProps() {
  const ownedItemsSelectorInstance = ownedItemsSelector();
  return (state: RootState): StoreProps => {
    const settings = settingsSelector(state);
    return {
      buckets: bucketsSelector(state),
      defs: state.manifest.d2Manifest,
      ownedItemHashes: ownedItemsSelectorInstance(state),
      profileResponse: profileResponseSelector(state),
      searchQuery: querySelector(state),
      searchFilter: searchFilterSelector(state),
      isPhonePortrait: isPhonePortraitSelector(state),
      trackedTriumphs: trackedTriumphsSelector(state),
      completedRecordsHidden: settings.completedRecordsHidden,
      redactedRecordsRevealed: settings.redactedRecordsRevealed,
      destiny2CoreSettings: destiny2CoreSettingsSelector(state),
    };
  };
}

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
  destiny2CoreSettings,
  dispatch,
}: Props) {
  useLoadStores(account, Boolean(profileResponse));

  const { presentationNodeHashStr } = useParams<{ presentationNodeHashStr: string }>();
  const presentationNodeHash = presentationNodeHashStr
    ? parseInt(presentationNodeHashStr, 10)
    : undefined;

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

  const trackedRecordHash = profileResponse?.profileRecords?.data?.trackedRecordHash || 0;

  const profileHashes = _.compact([
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
        .map((k) => destiny2CoreSettings[k])
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
                    defs={defs}
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

export default connect<StoreProps>(mapStateToProps)(Collections);
