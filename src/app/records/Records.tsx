import CheckButton from 'app/dim-ui/CheckButton';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { useLoadStores } from 'app/inventory/store/hooks';
import { destiny2CoreSettingsSelector, useD2Definitions } from 'app/manifest/selectors';
import { TrackedTriumphs } from 'app/progress/TrackedTriumphs';
import { searchFilterSelector } from 'app/search/search-filter';
import { useSetting } from 'app/settings/hooks';
import { querySelector, useIsPhonePortrait } from 'app/shell/selectors';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { DestinyAccount } from '../accounts/destiny-account';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import {
  bucketsSelector,
  ownedItemsSelector,
  profileResponseSelector,
} from '../inventory/selectors';
import PresentationNodeRoot from './PresentationNodeRoot';
import styles from './Records.m.scss';

interface Props {
  account: DestinyAccount;
}

/**
 * The records screen shows account-wide things like Triumphs and Collections.
 */
export default function Records({ account }: Props) {
  const isPhonePortrait = useIsPhonePortrait();
  useLoadStores(account);
  const [searchParams] = useSearchParams();

  const presentationNodeHash = searchParams.has('presentationNodeHash')
    ? parseInt(searchParams.get('presentationNodeHash')!, 10)
    : undefined;
  const buckets = useSelector(bucketsSelector);
  const ownedItemHashes = useSelector(ownedItemsSelector);
  const profileResponse = useSelector(profileResponseSelector);
  const searchQuery = useSelector(querySelector);
  const searchFilter = useSelector(searchFilterSelector);
  const destiny2CoreSettings = useSelector(destiny2CoreSettingsSelector);
  const [completedRecordsHidden, setCompletedRecordsHidden] = useSetting('completedRecordsHidden');
  const [redactedRecordsRevealed, setRedactedRecordsRevealed] =
    useSetting('redactedRecordsRevealed');

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
    : [];

  // We put the hashes we know about from profile first
  const nodeHashes = [...new Set([...profileHashes, ...otherHashes])];

  const menuItems = [
    { id: 'trackedTriumphs', title: t('Progress.TrackedTriumphs') },
    ...nodeHashes
      .map((h) => defs.PresentationNode.get(h))
      .map((nodeDef) => ({
        id: `p_${nodeDef.hash}`,
        title: overrideTitles[nodeDef.hash] || nodeDef.displayProperties.name,
      })),
  ];

  const onToggleCompletedRecordsHidden = (checked: boolean) => setCompletedRecordsHidden(checked);
  const onToggleRedactedRecordsRevealed = (checked: boolean) => setRedactedRecordsRevealed(checked);

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
        <div className={styles.presentationNodeOptions}>
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

      <PageWithMenu.Contents className={styles.page}>
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
            // console.log(nodeDef)
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
                    ownedItemHashes={ownedItemHashes.accountWideOwned}
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
