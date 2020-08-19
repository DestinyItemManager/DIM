import { t } from 'app/i18next-t';
import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import { DestinyAccount } from '../accounts/destiny-account';
import './progress.scss';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import { connect } from 'react-redux';
import { RootState } from 'app/store/types';
import { refresh$ } from '../shell/refresh';
import CollapsibleTitle from '../dim-ui/CollapsibleTitle';
import PresentationNodeRoot from '../collections/PresentationNodeRoot';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import { DimStore } from 'app/inventory/store-types';
import {
  sortedStoresSelector,
  profileResponseSelector,
  bucketsSelector,
} from 'app/inventory/selectors';
import { D2StoresService } from 'app/inventory/d2-stores';
import CharacterSelect from 'app/dim-ui/CharacterSelect';
import { queueAction } from 'app/inventory/action-queue';
import Pursuits from './Pursuits';
import Milestones from './Milestones';
import Ranks from './Ranks';
import Raids from './Raids';
import Hammer from 'react-hammerjs';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import { useSubscription } from 'app/utils/hooks';
import { getStore, getCurrentStore } from 'app/inventory/stores-helpers';
import SolsticeOfHeroes, { solsticeOfHeroesArmor } from './SolsticeOfHeroes';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { RAID_NODE, SEALS_ROOT_NODE, TRIUMPHS_ROOT_NODE } from 'app/search/d2-known-values';

interface ProvidedProps {
  account: DestinyAccount;
}

interface StoreProps {
  isPhonePortrait: boolean;
  buckets?: InventoryBuckets;
  defs?: D2ManifestDefinitions;
  stores: DimStore[];
  profileInfo?: DestinyProfileResponse;
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps(state: RootState): StoreProps {
  return {
    isPhonePortrait: state.shell.isPhonePortrait,
    stores: sortedStoresSelector(state),
    defs: state.manifest.d2Manifest,
    buckets: bucketsSelector(state),
    profileInfo: profileResponseSelector(state),
  };
}

const refreshStores = () =>
  refresh$.subscribe(() => queueAction(() => D2StoresService.reloadStores()));

function Progress({ account, defs, stores, isPhonePortrait, buckets, profileInfo }: Props) {
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

  // TODO: Searchable (item, description)
  // TODO: triumph search?
  // TODO: track triumphs?
  // TODO: close / pinnacle triumphs?
  // TODO: move vendor load into faction component?
  // TODO: badge the corner of expired bounties (red background, clock)
  // TODO: show rewards in item popup
  // TODO: show "flavor text" in item popup (itemDef.displaySource)
  // TODO: show expiration in item popup
  // TODO: show tracked overlay
  // TODO: do our own display, don't need the full inventory item right?
  // TODO: break up into components!
  // TODO: grid the triumphs
  // TODO: show expiration
  // TODO: separate milestones (daily, weekly, story?)
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

  const triumphTitle = defs.PresentationNode.get(TRIUMPHS_ROOT_NODE).displayProperties.name;
  const sealTitle = defs.PresentationNode.get(SEALS_ROOT_NODE).displayProperties.name;
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
    { id: 'triumphs', title: triumphTitle },
    { id: 'seals', title: sealTitle },
  ];

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

              <section id="triumphs">
                <ErrorBoundary name="Triumphs">
                  <PresentationNodeRoot
                    presentationNodeHash={TRIUMPHS_ROOT_NODE}
                    defs={defs}
                    profileResponse={profileInfo}
                  />
                </ErrorBoundary>
              </section>

              <section id="seals">
                <ErrorBoundary name="Seals">
                  <PresentationNodeRoot
                    presentationNodeHash={SEALS_ROOT_NODE}
                    defs={defs}
                    profileResponse={profileInfo}
                  />
                </ErrorBoundary>
              </section>
            </div>
          </Hammer>
        </PageWithMenu.Contents>
      </PageWithMenu>
    </ErrorBoundary>
  );
}

export default connect<StoreProps>(mapStateToProps)(Progress);
