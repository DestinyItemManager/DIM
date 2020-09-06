import { trackedTriumphsSelector } from 'app/dim-api/selectors';
import CharacterSelect from 'app/dim-ui/CharacterSelect';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { queueAction } from 'app/inventory/action-queue';
import { D2StoresService } from 'app/inventory/d2-stores';
import { DimItem } from 'app/inventory/item-types';
import {
  bucketsSelector,
  profileResponseSelector,
  sortedStoresSelector,
} from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { getCurrentStore, getStore } from 'app/inventory/stores-helpers';
import { RAID_NODE } from 'app/search/d2-known-values';
import { searchFilterSelector } from 'app/search/search-filter';
import { querySelector } from 'app/shell/reducer';
import { RootState } from 'app/store/types';
import { useSubscription } from 'app/utils/hooks';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import React, { useEffect, useState } from 'react';
import Hammer from 'react-hammerjs';
import { connect } from 'react-redux';
import { DestinyAccount } from '../accounts/destiny-account';
import PresentationNodeRoot from '../collections/PresentationNodeRoot';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import CollapsibleTitle from '../dim-ui/CollapsibleTitle';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import { refresh$ } from '../shell/refresh';
import Milestones from './Milestones';
import './progress.scss';
import Pursuits from './Pursuits';
import Raids from './Raids';
import Ranks from './Ranks';
import SolsticeOfHeroes, { solsticeOfHeroesArmor } from './SolsticeOfHeroes';
import { TrackedTriumphs } from './TrackedTriumphs';

interface ProvidedProps {
  account: DestinyAccount;
}

interface StoreProps {
  isPhonePortrait: boolean;
  buckets?: InventoryBuckets;
  defs?: D2ManifestDefinitions;
  stores: DimStore[];
  profileInfo?: DestinyProfileResponse;
  searchQuery?: string;
  trackedTriumphs: number[];
  searchFilter?(item: DimItem): boolean;
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps(state: RootState): StoreProps {
  return {
    isPhonePortrait: state.shell.isPhonePortrait,
    stores: sortedStoresSelector(state),
    defs: state.manifest.d2Manifest,
    buckets: bucketsSelector(state),
    profileInfo: profileResponseSelector(state),
    searchQuery: querySelector(state),
    searchFilter: searchFilterSelector(state),
    trackedTriumphs: trackedTriumphsSelector(state),
  };
}

const refreshStores = () =>
  refresh$.subscribe(() => queueAction(() => D2StoresService.reloadStores()));

function Progress({
  account,
  defs,
  stores,
  isPhonePortrait,
  buckets,
  profileInfo,
  searchQuery,
  searchFilter,
  trackedTriumphs,
}: Props) {
  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!profileInfo) {
      D2StoresService.getStoresStream(account);
    }
  });

  useSubscription(refreshStores);

  if (!defs || !profileInfo || !stores.length) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  // TODO: track triumphs?
  // TODO: close / pinnacle triumphs?
  // TODO: make milestones and pursuits look similar?
  // TODO: search/filter by activity
  // TODO: dropdowns for searches (reward, activity)

  // Non-item info:
  // * expiration
  // * flavor text
  // * rewards

  const handleSwipe: HammerListener = (e) => {
    const characters = stores.filter((s) => !s.isVault);

    const selectedStoreIndex = selectedStoreId
      ? characters.findIndex((s) => s.id === selectedStoreId)
      : characters.findIndex((s) => s.current);

    if (e.direction === 2 && selectedStoreIndex < characters.length - 1) {
      setSelectedStoreId(characters[selectedStoreIndex + 1].id);
    } else if (e.direction === 4 && selectedStoreIndex > 0) {
      setSelectedStoreId(characters[selectedStoreIndex - 1].id);
    }
  };

  const selectedStore = selectedStoreId
    ? getStore(stores, selectedStoreId)!
    : getCurrentStore(stores)!;

  if (!defs || !buckets) {
    return null;
  }

  const recordsRootHash = profileInfo.profileRecords.data?.recordCategoriesRootNodeHash;
  const sealsRootHash = profileInfo.profileRecords.data?.recordSealsRootNodeHash;
  const triumphTitle =
    recordsRootHash && defs.PresentationNode.get(recordsRootHash).displayProperties.name;
  const sealTitle =
    sealsRootHash && defs.PresentationNode.get(sealsRootHash).displayProperties.name;
  const raidTitle = defs.PresentationNode.get(RAID_NODE).displayProperties.name;

  const solsticeTitle = defs.InventoryItem.get(3723510815).displayProperties.name;
  const solsticeArmor = solsticeOfHeroesArmor(stores, selectedStore);

  const menuItems = [
    { id: 'ranks', title: t('Progress.CrucibleRank') },
    ...(solsticeArmor.length ? [{ id: 'solstice', title: solsticeTitle }] : []),
    { id: 'milestones', title: t('Progress.Milestones') },
    { id: 'Bounties', title: t('Progress.Bounties') },
    { id: 'Quests', title: t('Progress.Quests') },
    { id: 'Items', title: t('Progress.Items') },
    { id: 'raids', title: raidTitle },
    { id: 'trackedTriumphs', title: t('Progress.TrackedTriumphs') },
    { id: 'triumphs', title: triumphTitle },
    { id: 'seals', title: sealTitle },
  ];
  const trackedRecordHash = profileInfo?.profileRecords?.data?.trackedRecordHash || 0;

  return (
    <ErrorBoundary name="Progress">
      <PageWithMenu className="progress-page">
        <PageWithMenu.Menu>
          {selectedStore && (
            <CharacterSelect
              stores={stores}
              vertical={!isPhonePortrait}
              isPhonePortrait={isPhonePortrait}
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
          <Hammer direction="DIRECTION_HORIZONTAL" onSwipe={handleSwipe}>
            <div>
              <section id="ranks">
                <CollapsibleTitle title={t('Progress.CrucibleRank')} sectionId="profile-ranks">
                  <div className="progress-row">
                    <ErrorBoundary name="CrucibleRanks">
                      <Ranks profileInfo={profileInfo} defs={defs} />
                    </ErrorBoundary>
                  </div>
                </CollapsibleTitle>
              </section>

              <SolsticeOfHeroes defs={defs} armor={solsticeArmor} title={solsticeTitle} />

              <section id="milestones">
                <CollapsibleTitle title={t('Progress.Milestones')} sectionId="milestones">
                  <div className="progress-row">
                    <ErrorBoundary name="Milestones">
                      <Milestones
                        defs={defs}
                        buckets={buckets}
                        profileInfo={profileInfo}
                        store={selectedStore}
                      />
                    </ErrorBoundary>
                  </div>
                </CollapsibleTitle>
              </section>

              <ErrorBoundary name="Pursuits">
                <Pursuits store={selectedStore} defs={defs} />
              </ErrorBoundary>

              <section id="raids">
                <CollapsibleTitle title={raidTitle} sectionId="raids">
                  <div className="progress-row">
                    <ErrorBoundary name="Raids">
                      <Raids store={selectedStore} defs={defs} profileInfo={profileInfo} />
                    </ErrorBoundary>
                  </div>
                </CollapsibleTitle>
              </section>

              <section id="trackedTriumphs">
                <CollapsibleTitle title={t('Progress.TrackedTriumphs')} sectionId="trackedTriumphs">
                  <div className="progress-row">
                    <ErrorBoundary name={t('Progress.TrackedTriumphs')}>
                      <TrackedTriumphs
                        trackedTriumphs={trackedTriumphs}
                        trackedRecordHash={trackedRecordHash}
                        defs={defs}
                        profileResponse={profileInfo}
                        searchQuery={searchQuery}
                      />
                    </ErrorBoundary>
                  </div>
                </CollapsibleTitle>
              </section>

              {recordsRootHash && (
                <section id="triumphs">
                  <ErrorBoundary name="Triumphs">
                    <PresentationNodeRoot
                      presentationNodeHash={recordsRootHash}
                      defs={defs}
                      profileResponse={profileInfo}
                      isTriumphs={true}
                      searchQuery={searchQuery}
                      searchFilter={searchFilter}
                    />
                  </ErrorBoundary>
                </section>
              )}

              {sealsRootHash && (
                <section id="seals">
                  <ErrorBoundary name="Seals">
                    <PresentationNodeRoot
                      presentationNodeHash={sealsRootHash}
                      defs={defs}
                      profileResponse={profileInfo}
                      searchQuery={searchQuery}
                      searchFilter={searchFilter}
                    />
                  </ErrorBoundary>
                </section>
              )}
            </div>
          </Hammer>
        </PageWithMenu.Contents>
      </PageWithMenu>
    </ErrorBoundary>
  );
}

export default connect<StoreProps>(mapStateToProps)(Progress);
