import CheckButton from 'app/dim-ui/CheckButton';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { useLoadStores } from 'app/inventory/store/hooks';
import { destiny2CoreSettingsSelector, useD2Definitions } from 'app/manifest/selectors';
import { TrackedTriumphs } from 'app/progress/TrackedTriumphs';
import { searchFilterSelector } from 'app/search/items/item-search-filter';
import { useSetting } from 'app/settings/hooks';
import { querySelector } from 'app/shell/selectors';
import { compact, filterMap } from 'app/utils/collections';
import { usePageTitle } from 'app/utils/hooks';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router';
import { DestinyAccount } from '../accounts/destiny-account';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import {
  bucketsSelector,
  ownedItemsSelector,
  profileResponseSelector,
} from '../inventory/selectors';
import { UNIVERSAL_ORNAMENTS_NODE } from '../search/d2-known-values';
import PresentationNodeRoot from './PresentationNodeRoot';
import * as styles from './Records.m.scss';
import UniversalOrnaments from './universal-ornaments/UniversalOrnaments';

interface Props {
  account: DestinyAccount;
}

/**
 * The records screen shows account-wide things like Triumphs and Collections.
 */
export default function Records({ account }: Props) {
  useLoadStores(account);
  const [searchParams] = useSearchParams();
  usePageTitle(t('Records.Title'));

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
  const [sortRecordProgression, setSortRecordProgression] = useSetting('sortRecordProgression');

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

  const profileHashes = compact([
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
    ? filterMap(Object.entries(destiny2CoreSettings), ([key, value]) =>
        key.includes('RootNode') && key !== 'craftingRootNodeHash' && typeof value === 'number'
          ? value
          : undefined,
      )
    : [];

  const universalOrnamentsName =
    defs.PresentationNode.get(UNIVERSAL_ORNAMENTS_NODE)?.displayProperties.name ?? '???';

  // We put the hashes we know about from profile first
  const nodeHashes = [...new Set([...profileHashes, ...otherHashes])];

  const presentationNodes = nodeHashes.map((h) => defs.PresentationNode.get(h)).filter(Boolean);

  const menuItems = [
    { id: 'trackedTriumphs', title: t('Progress.TrackedTriumphs') },
    ...presentationNodes.filter(Boolean).map((nodeDef) => ({
      id: `p_${nodeDef.hash}`,
      title: overrideTitles[nodeDef.hash] || nodeDef.displayProperties.name,
    })),
    { id: 'universalOrnaments', title: universalOrnamentsName },
  ];

  return (
    <PageWithMenu className="d2-vendors">
      <PageWithMenu.Menu>
        {menuItems.map((menuItem) => (
          <PageWithMenu.MenuButton key={menuItem.id} anchor={menuItem.id}>
            <span>{menuItem.title}</span>
          </PageWithMenu.MenuButton>
        ))}
        <div className={styles.presentationNodeOptions}>
          <CheckButton
            name="hide-completed"
            checked={completedRecordsHidden}
            onChange={setCompletedRecordsHidden}
          >
            {t('Triumphs.HideCompleted')}
          </CheckButton>
          <CheckButton
            name="reveal-redacted"
            checked={redactedRecordsRevealed}
            onChange={setRedactedRecordsRevealed}
          >
            {t('Triumphs.RevealRedacted')}
          </CheckButton>
          <CheckButton
            name="sort-progression"
            checked={sortRecordProgression}
            onChange={setSortRecordProgression}
          >
            {t('Triumphs.SortRecords')}
          </CheckButton>
        </div>
      </PageWithMenu.Menu>

      <PageWithMenu.Contents className={styles.page}>
        <section id="trackedTriumphs">
          <CollapsibleTitle title={t('Progress.TrackedTriumphs')} sectionId="trackedTriumphs">
            <TrackedTriumphs searchQuery={searchQuery} />
          </CollapsibleTitle>
        </section>
        {presentationNodes.map((nodeDef) => (
          <section key={nodeDef.hash} id={`p_${nodeDef.hash}`}>
            <CollapsibleTitle
              title={overrideTitles[nodeDef.hash] || nodeDef.displayProperties.name}
              sectionId={`p_${nodeDef.hash}`}
            >
              <PresentationNodeRoot
                presentationNodeHash={nodeDef.hash}
                profileResponse={profileResponse}
                ownedItemHashes={ownedItemHashes.accountWideOwned}
                openedPresentationHash={presentationNodeHash}
                searchQuery={searchQuery}
                searchFilter={searchFilter}
                overrideName={overrideTitles[nodeDef.hash]}
                isTriumphs={nodeDef.hash === recordsRootHash}
                showPlugSets={nodeDef.hash === collectionsRootHash}
                completedRecordsHidden={completedRecordsHidden}
              />
            </CollapsibleTitle>
          </section>
        ))}
        <section id="universalOrnaments">
          <CollapsibleTitle title={universalOrnamentsName} sectionId="universalOrnaments">
            <ErrorBoundary name={universalOrnamentsName}>
              <UniversalOrnaments searchQuery={searchQuery} searchFilter={searchFilter} />
            </ErrorBoundary>
          </CollapsibleTitle>
        </section>
      </PageWithMenu.Contents>
    </PageWithMenu>
  );
}
