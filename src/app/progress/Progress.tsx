import { t } from 'app/i18next-t';
import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import { DestinyAccount } from '../accounts/destiny-account';
import './progress.scss';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import { connect } from 'react-redux';
import { RootState } from '../store/reducers';
import { refresh$ } from '../shell/refresh';
import CollapsibleTitle from '../dim-ui/CollapsibleTitle';
import PresentationNodeRoot from '../collections/PresentationNodeRoot';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import { D2ManifestDefinitions, getDefinitions } from '../destiny2/d2-definitions';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import { DimStore } from 'app/inventory/store-types';
import { sortedStoresSelector, profileResponseSelector } from 'app/inventory/selectors';
import { D2StoresService } from 'app/inventory/d2-stores';
import CharacterSelect from 'app/dim-ui/CharacterSelect';
import { AppIcon, faExternalLinkAlt } from 'app/shell/icons';
import { queueAction } from 'app/inventory/action-queue';
import destinySetsLogo from '../../images/destinySetsLogo.svg';
import braytechLogo from '../../images/braytechLogo.svg';
import d2ChecklistLogo from '../../images/d2ChecklistLogo.svg';
import Pursuits from './Pursuits';
import Milestones from './Milestones';
import Ranks from './Ranks';
import Raids from './Raids';
import Hammer from 'react-hammerjs';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import { useSubscription } from 'app/utils/hooks';
import { getStore, getCurrentStore } from 'app/inventory/stores-helpers';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';

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
    buckets: state.inventory.buckets,
    profileInfo: profileResponseSelector(state)
  };
}

const refreshStores = () =>
  refresh$.subscribe(() => queueAction(() => D2StoresService.reloadStores()));

function Progress({ account, defs, stores, isPhonePortrait, buckets, profileInfo }: Props) {
  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!defs) {
      getDefinitions();
    }
  }, [defs]);

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

  const triumphTitle = defs.PresentationNode.get(1024788583).displayProperties.name;
  const sealTitle = defs.PresentationNode.get(1652422747).displayProperties.name;
  const raidTitle = defs.PresentationNode.get(2975760062).displayProperties.name;

  const menuItems = [
    { id: 'ranks', title: t('Progress.CrucibleRank') },
    { id: 'milestones', title: t('Progress.Milestones') },
    { id: 'Bounties', title: t('Progress.Bounties') },
    { id: 'Quests', title: t('Progress.Quests') },
    { id: 'Items', title: t('Progress.Items') },
    { id: 'raids', title: raidTitle },
    { id: 'triumphs', title: triumphTitle },
    { id: 'seals', title: sealTitle }
  ];
  const externalLinks = [
    {
      href: `https://braytech.org/${account.originalPlatformType}/${account.membershipId}/${selectedStore.id}/`,
      title: 'BrayTech.org',
      logo: braytechLogo
    },
    { href: 'https://destinysets.com/', title: 'DestinySets', logo: destinySetsLogo },
    { href: 'https://lowlidev.com.au/destiny/maps', title: 'lowlidev maps' },
    {
      href: `https://www.d2checklist.com/${account.originalPlatformType}/${account.membershipId}`,
      title: 'D2Checklist',
      logo: d2ChecklistLogo
    }
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
              {externalLinks.map((menuItem) => (
                <PageWithMenu.MenuButton
                  key={menuItem.href}
                  className="menu-link"
                  href={menuItem.href}
                  target="_blank"
                >
                  {menuItem.logo && <img src={menuItem.logo} />}
                  <span>
                    {menuItem.title} <AppIcon icon={faExternalLinkAlt} />
                  </span>
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
                    presentationNodeHash={1024788583}
                    defs={defs}
                    profileResponse={profileInfo}
                  />
                </ErrorBoundary>
              </section>

              <section id="seals">
                <ErrorBoundary name="Seals">
                  <PresentationNodeRoot
                    presentationNodeHash={1652422747}
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
