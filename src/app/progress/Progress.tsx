import CharacterSelect from 'app/dim-ui/CharacterSelect';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import {
  bucketsSelector,
  profileResponseSelector,
  sortedStoresSelector,
} from 'app/inventory/selectors';
import { useLoadStores } from 'app/inventory/store/hooks';
import { getCurrentStore, getStore } from 'app/inventory/stores-helpers';
import { destiny2CoreSettingsSelector, useD2Definitions } from 'app/manifest/selectors';
import { RAID_NODE } from 'app/search/d2-known-values';
import { querySelector, useIsPhonePortrait } from 'app/shell/selectors';
import { compact } from 'app/utils/collections';
import { usePageTitle } from 'app/utils/hooks';
import { PanInfo, motion } from 'motion/react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { DestinyAccount } from '../accounts/destiny-account';
import CollapsibleTitle from '../dim-ui/CollapsibleTitle';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import { Event } from './Event';
import Milestones from './Milestones';
import Pathfinder from './Pathfinder';
import * as styles from './Progress.m.scss';
import Pursuits from './Pursuits';
import Raids from './Raids';
import Ranks from './Ranks';
import SeasonalChallenges from './SeasonalChallenges';
import SeasonalRank from './SeasonalRank';
import { TrackedTriumphs } from './TrackedTriumphs';
import WellRestedPerkIcon from './WellRestedPerkIcon';

export default function Progress({ account }: { account: DestinyAccount }) {
  const defs = useD2Definitions();
  const isPhonePortrait = useIsPhonePortrait();
  const stores = useSelector(sortedStoresSelector);
  const buckets = useSelector(bucketsSelector);
  const profileInfo = useSelector(profileResponseSelector);
  const searchQuery = useSelector(querySelector);
  const coreSettings = useSelector(destiny2CoreSettingsSelector);
  usePageTitle(t('Progress.Progress'));

  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>(undefined);

  const storesLoaded = useLoadStores(account);

  if (!defs || !profileInfo || !storesLoaded) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  // TODO: make milestones and pursuits look similar?
  // TODO: search/filter by activity
  // TODO: dropdowns for searches (reward, activity)

  const handleSwipe = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Velocity is in px/ms
    if (Math.abs(info.offset.x) < 10 || Math.abs(info.velocity.x) < 300) {
      return;
    }

    const direction = -Math.sign(info.velocity.x);

    const characters = stores.filter((s) => !s.isVault);

    const selectedStoreIndex = selectedStoreId
      ? characters.findIndex((s) => s.id === selectedStoreId)
      : characters.findIndex((s) => s.current);

    if (direction > 0 && selectedStoreIndex < characters.length - 1) {
      setSelectedStoreId(characters[selectedStoreIndex + 1].id);
    } else if (direction < 0 && selectedStoreIndex > 0) {
      setSelectedStoreId(characters[selectedStoreIndex - 1].id);
    }
  };

  const selectedStore = selectedStoreId
    ? getStore(stores, selectedStoreId)!
    : getCurrentStore(stores)!;

  if (!buckets) {
    return null;
  }

  const raidNode = defs.PresentationNode.get(RAID_NODE);
  const raidTitle = raidNode?.displayProperties.name;

  const eventCardHash = profileInfo.profile.data?.activeEventCardHash;
  const eventCard = eventCardHash !== undefined && defs.EventCard.get(eventCardHash);

  const seasonalChallengesPresentationNode =
    coreSettings?.seasonalChallengesPresentationNodeHash !== undefined &&
    defs.PresentationNode.get(coreSettings.seasonalChallengesPresentationNodeHash);

  const paleHeartPathfinderNode = defs.PresentationNode.get(1062988660);

  const menuItems = compact([
    { id: 'ranks', title: t('Progress.CrucibleRank') },
    { id: 'trackedTriumphs', title: t('Progress.TrackedTriumphs') },
    eventCard && {
      id: 'event',
      title: eventCard.displayProperties.name || t('Progress.SeasonalHub'),
    },
    { id: 'milestones', title: t('Progress.Milestones') },
    paleHeartPathfinderNode && {
      id: 'paleHeartPathfinder',
      title: t('Progress.PaleHeartPathfinder'),
    },
    seasonalChallengesPresentationNode && {
      id: 'seasonal-challenges',
      title: seasonalChallengesPresentationNode.displayProperties.name,
    },
    { id: 'Bounties', title: t('Progress.Bounties') },
    { id: 'Quests', title: t('Progress.Quests') },
    { id: 'Items', title: t('Progress.Items') },
    raidNode && { id: 'raids', title: raidTitle },
  ]);

  return (
    <PageWithMenu>
      <PageWithMenu.Menu>
        {selectedStore && (
          <CharacterSelect
            stores={stores}
            selectedStore={selectedStore}
            onCharacterChanged={setSelectedStoreId}
          />
        )}
        {!isPhonePortrait && (
          <div className={styles.menuLinks}>
            {menuItems.map((menuItem) => (
              <PageWithMenu.MenuButton key={menuItem.id} anchor={menuItem.id}>
                <span>{menuItem.title}</span>
              </PageWithMenu.MenuButton>
            ))}
          </div>
        )}
      </PageWithMenu.Menu>

      <PageWithMenu.Contents className={styles.progress}>
        <motion.div className="horizontal-swipable" onPanEnd={handleSwipe}>
          <section id="ranks">
            <CollapsibleTitle title={t('Progress.CrucibleRank')} sectionId="profile-ranks">
              <div className="progress-row">
                <Ranks profileInfo={profileInfo}>
                  <WellRestedPerkIcon profileInfo={profileInfo} />
                  <SeasonalRank store={selectedStore} profileInfo={profileInfo} />
                </Ranks>
              </div>
            </CollapsibleTitle>
          </section>

          <section id="trackedTriumphs">
            <CollapsibleTitle title={t('Progress.TrackedTriumphs')} sectionId="trackedTriumphs">
              <div className="progress-row">
                <TrackedTriumphs searchQuery={searchQuery} />
              </div>
            </CollapsibleTitle>
          </section>

          {eventCard && (
            <section id="event">
              <CollapsibleTitle
                title={eventCard.displayProperties.name || t('Progress.SeasonalHub')}
                sectionId="event"
              >
                <div className="progress-row">
                  <Event card={eventCard} store={selectedStore} buckets={buckets} />
                </div>
              </CollapsibleTitle>
            </section>
          )}

          <section id="milestones">
            <CollapsibleTitle title={t('Progress.Milestones')} sectionId="milestones">
              <div className="progress-row">
                <Milestones buckets={buckets} profileInfo={profileInfo} store={selectedStore} />
              </div>
            </CollapsibleTitle>
          </section>

          {paleHeartPathfinderNode && (
            <ErrorBoundary name={t('Progress.PaleHeartPathfinder')}>
              <Pathfinder
                id="paleHeartPathfinder"
                name={t('Progress.PaleHeartPathfinder')}
                presentationNode={paleHeartPathfinderNode}
                store={selectedStore}
              />
            </ErrorBoundary>
          )}

          {seasonalChallengesPresentationNode && (
            <ErrorBoundary name="SeasonalChallenges">
              <SeasonalChallenges
                seasonalChallengesPresentationNode={seasonalChallengesPresentationNode}
                store={selectedStore}
              />
            </ErrorBoundary>
          )}

          <ErrorBoundary name="Pursuits">
            <Pursuits store={selectedStore} />
          </ErrorBoundary>

          {raidNode && (
            <section id="raids">
              <CollapsibleTitle title={raidTitle} sectionId="raids">
                <div className="progress-row">
                  <Raids store={selectedStore} profileInfo={profileInfo} />
                </div>
              </CollapsibleTitle>
            </section>
          )}
        </motion.div>
      </PageWithMenu.Contents>
    </PageWithMenu>
  );
}
