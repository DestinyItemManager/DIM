import CharacterSelect from 'app/dim-ui/CharacterSelect';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import {
  allItemsSelector,
  bucketsSelector,
  profileResponseSelector,
  sortedStoresSelector,
} from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { useLoadStores } from 'app/inventory/store/hooks';
import { getCurrentStore, getStore } from 'app/inventory/stores-helpers';
import { destiny2CoreSettingsSelector, useD2Definitions } from 'app/manifest/selectors';
import { RAID_NODE } from 'app/search/d2-known-values';
import { querySelector, useIsPhonePortrait } from 'app/shell/selectors';
import { RootState } from 'app/store/types';
import { Destiny2CoreSettings } from 'bungie-api-ts/core';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import { motion, PanInfo } from 'framer-motion';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { DestinyAccount } from '../accounts/destiny-account';
import CollapsibleTitle from '../dim-ui/CollapsibleTitle';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import '../records/PresentationNode.scss';
import Milestones from './Milestones';
import './progress.scss';
import Pursuits from './Pursuits';
import Raids from './Raids';
import Ranks from './Ranks';
import SeasonalChallenges from './SeasonalChallenges';
import SolsticeOfHeroes, { solsticeOfHeroesArmor } from './SolsticeOfHeroes';
import { TrackedTriumphs } from './TrackedTriumphs';

interface ProvidedProps {
  account: DestinyAccount;
}

interface StoreProps {
  buckets?: InventoryBuckets;
  stores: DimStore[];
  profileInfo?: DestinyProfileResponse;
  searchQuery?: string;
  allItems: DimItem[];
  coreSettings?: Destiny2CoreSettings;
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps(state: RootState): StoreProps {
  return {
    stores: sortedStoresSelector(state),
    buckets: bucketsSelector(state),
    profileInfo: profileResponseSelector(state),
    searchQuery: querySelector(state),
    allItems: allItemsSelector(state),
    coreSettings: destiny2CoreSettingsSelector(state),
  };
}

function Progress({
  account,
  stores,
  buckets,
  profileInfo,
  searchQuery,
  allItems,
  coreSettings,
}: Props) {
  const defs = useD2Definitions();
  const isPhonePortrait = useIsPhonePortrait();
  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>(undefined);

  useLoadStores(account);

  if (!defs || !profileInfo || !stores.length) {
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

  const solsticeTitle = defs.InventoryItem.get(3723510815).displayProperties.name;
  const solsticeArmor = solsticeOfHeroesArmor(allItems, selectedStore);

  const seasonalChallengesPresentationNode =
    coreSettings?.seasonalChallengesPresentationNodeHash &&
    defs.PresentationNode.get(coreSettings.seasonalChallengesPresentationNodeHash);

  const menuItems = [
    { id: 'ranks', title: t('Progress.CrucibleRank') },
    { id: 'trackedTriumphs', title: t('Progress.TrackedTriumphs') },
    ...(solsticeArmor.length ? [{ id: 'solstice', title: solsticeTitle }] : []),
    { id: 'milestones', title: t('Progress.Milestones') },
    ...(seasonalChallengesPresentationNode
      ? [
          {
            id: 'seasonal-challenges',
            title: seasonalChallengesPresentationNode.displayProperties.name,
          },
        ]
      : []),
    { id: 'Bounties', title: t('Progress.Bounties') },
    { id: 'Quests', title: t('Progress.Quests') },
    { id: 'Items', title: t('Progress.Items') },
    ...(raidNode ? [{ id: 'raids', title: raidTitle }] : []),
  ];

  return (
    <ErrorBoundary name="Progress">
      <PageWithMenu className="progress-page">
        <PageWithMenu.Menu>
          {selectedStore && (
            <CharacterSelect
              stores={stores}
              selectedStore={selectedStore}
              onCharacterChanged={setSelectedStoreId}
            />
          )}
          {!isPhonePortrait && (
            <div className="progress-menu">
              {menuItems.map((menuItem) => (
                <PageWithMenu.MenuButton key={menuItem.id} anchor={menuItem.id}>
                  <span>{menuItem.title}</span>
                </PageWithMenu.MenuButton>
              ))}
            </div>
          )}
        </PageWithMenu.Menu>

        <PageWithMenu.Contents className="progress-panel">
          <motion.div className="horizontal-swipeable" onPanEnd={handleSwipe}>
            <section id="ranks">
              <CollapsibleTitle title={t('Progress.CrucibleRank')} sectionId="profile-ranks">
                <div className="progress-row">
                  <ErrorBoundary name="CrucibleRanks">
                    <Ranks profileInfo={profileInfo} />
                  </ErrorBoundary>
                </div>
              </CollapsibleTitle>
            </section>

            <section id="trackedTriumphs">
              <CollapsibleTitle title={t('Progress.TrackedTriumphs')} sectionId="trackedTriumphs">
                <div className="progress-row">
                  <ErrorBoundary name={t('Progress.TrackedTriumphs')}>
                    <TrackedTriumphs searchQuery={searchQuery} />
                  </ErrorBoundary>
                </div>
              </CollapsibleTitle>
            </section>

            <SolsticeOfHeroes armor={solsticeArmor} title={solsticeTitle} />

            <section id="milestones">
              <CollapsibleTitle title={t('Progress.Milestones')} sectionId="milestones">
                <div className="progress-row">
                  <ErrorBoundary name="Milestones">
                    <Milestones buckets={buckets} profileInfo={profileInfo} store={selectedStore} />
                  </ErrorBoundary>
                </div>
              </CollapsibleTitle>
            </section>

            {seasonalChallengesPresentationNode && (
              <ErrorBoundary name="SeasonalChallenges">
                <SeasonalChallenges
                  seasonalChallengesPresentationNode={seasonalChallengesPresentationNode}
                  store={selectedStore}
                  buckets={buckets}
                  profileResponse={profileInfo}
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
                    <ErrorBoundary name="Raids">
                      <Raids store={selectedStore} profileInfo={profileInfo} />
                    </ErrorBoundary>
                  </div>
                </CollapsibleTitle>
              </section>
            )}
          </motion.div>
        </PageWithMenu.Contents>
      </PageWithMenu>
    </ErrorBoundary>
  );
}

export default connect<StoreProps>(mapStateToProps)(Progress);
