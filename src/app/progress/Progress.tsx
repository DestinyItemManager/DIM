import {
  DestinyFactionProgression,
  DestinyMilestone,
  DestinyVendorComponent
} from 'bungie-api-ts/destiny2';
import { t } from 'app/i18next-t';
import React from 'react';
import _ from 'lodash';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { characterIsCurrent } from './CharacterTile';
import { Faction } from './Faction';
import { Milestone } from './Milestone';
import { Raid } from './Raid';
import './progress.scss';
import { ProgressProfile, reloadProgress, getProgressStream } from './progress.service';
import WellRestedPerkIcon from './WellRestedPerkIcon';
import { CrucibleRank } from './CrucibleRank';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import { Loading } from '../dim-ui/Loading';
import { connect } from 'react-redux';
import { RootState } from '../store/reducers';
import { chainComparator, compareBy } from '../comparators';
import { Subscriptions } from '../rx-utils';
import { refresh$ } from '../shell/refresh';
import CollapsibleTitle from '../dim-ui/CollapsibleTitle';
import PresentationNodeRoot from '../collections/PresentationNodeRoot';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import { D2ManifestDefinitions, getDefinitions } from '../destiny2/d2-definitions.service';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import { DimStore } from 'app/inventory/store-types';
import { sortedStoresSelector } from 'app/inventory/reducer';
import { D2StoresService } from 'app/inventory/d2-stores.service';
import CharacterSelect from 'app/character-select/CharacterSelect';
import { DimItem } from 'app/inventory/item-types';
import { AppIcon } from 'app/shell/icons';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import Pursuit, { showPursuitAsExpired } from './Pursuit';
import { queueAction } from 'app/inventory/action-queue';
import destinySetsLogo from '../../images/destinySetsLogo.svg';
import braytechLogo from '../../images/braytechLogo.svg';

const factionOrder = [
  611314723, // Vanguard,
  3231773039, // Vanguard Research,
  697030790, // Crucible,
  1021210278, // Gunsmith,

  4235119312, // EDZ Deadzone Scout,
  4196149087, // Titan Field Commander,
  1660497607, // Nessus AI,
  828982195, // Io Researcher,
  3859807381, // Voice of Rasputin,
  2677528157, // Follower of Osiris,
  24856709, // Leviathan,

  469305170, // The Nine,
  1761642340, // Iron Banner,

  2105209711, // New Monarchy,
  1714509342, // Future War Cult,
  3398051042 // Dead Orbit
];

// unfortunately the API's raid .order attribute is odd
const raidOrder = [
  3660836525, // levi
  2986584050, // eow
  2683538554, // sos
  3181387331, // wish
  1342567285, // scourge
  2590427074 // crown
];

interface ProvidedProps {
  account: DestinyAccount;
}

interface StoreProps {
  isPhonePortrait: boolean;
  buckets?: InventoryBuckets;
  defs?: D2ManifestDefinitions;
  stores: DimStore[];
}

type Props = ProvidedProps & StoreProps;

interface State {
  progress?: ProgressProfile;
  selectedStoreId?: string;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    isPhonePortrait: state.shell.isPhonePortrait,
    stores: sortedStoresSelector(state),
    defs: state.manifest.d2Manifest,
    buckets: state.inventory.buckets
  };
}

const sortQuests = chainComparator(
  compareBy(showPursuitAsExpired),
  compareBy((item) => !item.tracked),
  compareBy((item) => item.complete),
  compareBy((item) => {
    return item.isDestiny2() && item.quest && item.quest.expirationDate
      ? item.quest.expirationDate
      : new Date(8640000000000000);
  }),
  compareBy((item) => item.typeName),
  compareBy((item) => item.icon),
  compareBy((item) => item.name)
);

const pursuitsOrder = ['Bounties', 'Quests', 'Items'];

class Progress extends React.Component<Props, State> {
  private subscriptions = new Subscriptions();

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    if (!this.props.defs) {
      getDefinitions();
    }

    D2StoresService.getStoresStream(this.props.account);

    this.subscriptions.add(
      refresh$.subscribe(reloadProgress),
      refresh$.subscribe(() => queueAction(() => D2StoresService.reloadStores())),
      getProgressStream(this.props.account).subscribe((progress) => {
        this.setState((prevState) => {
          const updatedState: Partial<State> = {
            progress,
            selectedStoreId: prevState.selectedStoreId
          };
          if (!prevState.selectedStoreId) {
            const characters = Object.values(progress.profileInfo.characters.data || {});
            if (characters.length) {
              const lastPlayedDate = progress.lastPlayedDate;
              updatedState.selectedStoreId = characters.find((c) =>
                characterIsCurrent(c, lastPlayedDate)
              )!.characterId;
            }
          }

          return updatedState;
        });
      })
    );
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribe();
  }

  render() {
    const { defs, stores, isPhonePortrait, buckets } = this.props;
    const { progress, selectedStoreId } = this.state;
    if (!defs || !progress || !stores.length) {
      return (
        <div className="progress-page dim-page">
          <Loading />
        </div>
      );
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

    const { profileInfo } = progress;

    const selectedStore = selectedStoreId
      ? stores.find((s) => s.id === selectedStoreId)!
      : stores.find((s) => s.current)!;

    const profileMilestones = this.milestonesForProfile(selectedStore.id);

    const firstCharacterProgression = profileInfo.characterProgressions.data
      ? Object.values(profileInfo.characterProgressions.data)[0].progressions
      : {};
    const crucibleRanks = [
      // Valor
      firstCharacterProgression[2626549951],
      // Glory
      firstCharacterProgression[2000925172],
      // Infamy
      firstCharacterProgression[2772425241]
    ];

    if (!defs || !buckets) {
      return null;
    }

    const characterProgressions = profileInfo.characterProgressions.data || {};
    const character = selectedStore;

    const pursuits = this.questItems(character);

    const goToSection = (e: React.MouseEvent) => {
      e.preventDefault();
      const elem = document.getElementById((e.currentTarget as HTMLAnchorElement).hash.slice(1));
      if (elem) {
        const rect = elem.getBoundingClientRect();
        const options: ScrollToOptions = {
          top: window.scrollY + rect.top - 50,
          left: 0,
          behavior: 'smooth'
        };
        const isSmoothScrollSupported = 'scrollBehavior' in document.documentElement.style;
        if (isSmoothScrollSupported) {
          window.scroll(options);
        } else {
          window.scroll(options.top!, options.left!);
        }
      }
    };

    const triumphTitle = defs.PresentationNode.get(1024788583).displayProperties.name;
    const raidTitle = defs.PresentationNode.get(2975760062).displayProperties.name;

    return (
      <PageWithMenu className="progress-page">
        <PageWithMenu.Menu>
          {selectedStore && (
            <CharacterSelect
              stores={stores}
              vertical={!isPhonePortrait}
              isPhonePortrait={isPhonePortrait}
              selectedStore={selectedStore}
              onCharacterChanged={this.onCharacterChanged}
            />
          )}
          {!isPhonePortrait && (
            <div className="progress-menu">
              <PageWithMenu.MenuButton href="#ranks" onClick={goToSection}>
                <span>{t('Progress.CrucibleRank')}</span>
              </PageWithMenu.MenuButton>
              <PageWithMenu.MenuButton href="#milestones" onClick={goToSection}>
                <span>{t('Progress.Milestones')}</span>
              </PageWithMenu.MenuButton>
              <PageWithMenu.MenuButton href="#raids" onClick={goToSection}>
                <span>{raidTitle}</span>
              </PageWithMenu.MenuButton>
              <PageWithMenu.MenuButton href="#Bounties" onClick={goToSection}>
                <span>{t('Progress.Bounties')}</span>
              </PageWithMenu.MenuButton>
              <PageWithMenu.MenuButton href="#Quests" onClick={goToSection}>
                <span>{t('Progress.Quests')}</span>
              </PageWithMenu.MenuButton>
              <PageWithMenu.MenuButton href="#Items" onClick={goToSection}>
                <span>{t('Progress.Items')}</span>
              </PageWithMenu.MenuButton>
              <PageWithMenu.MenuButton href="#triumphs" onClick={goToSection}>
                <span>{triumphTitle}</span>
              </PageWithMenu.MenuButton>
              <PageWithMenu.MenuButton href="#factions" onClick={goToSection}>
                <span>{t('Progress.Factions')}</span>
              </PageWithMenu.MenuButton>
              <PageWithMenu.MenuButton
                className="menu-link"
                href="https://braytech.org/"
                target="_blank"
              >
                <img src={braytechLogo} />
                <span>
                  BrayTech.org <AppIcon icon={faExternalLinkAlt} />
                </span>
              </PageWithMenu.MenuButton>
              <PageWithMenu.MenuButton
                className="menu-link"
                href="https://destinysets.com/"
                target="_blank"
              >
                <img src={destinySetsLogo} />
                <span>
                  DestinySets <AppIcon icon={faExternalLinkAlt} />
                </span>
              </PageWithMenu.MenuButton>
              <PageWithMenu.MenuButton
                className="menu-link"
                href="https://lowlidev.com.au/destiny/maps"
                target="_blank"
              >
                <span>
                  lowlidev maps <AppIcon icon={faExternalLinkAlt} />
                </span>
              </PageWithMenu.MenuButton>
            </div>
          )}
        </PageWithMenu.Menu>
        <PageWithMenu.Contents>
          <div className="profile-content">
            <section className="crucible-ranks" id="ranks">
              <CollapsibleTitle title={t('Progress.CrucibleRank')} sectionId="profile-ranks">
                <div className="progress-row">
                  <div className="progress-for-character ranks-for-character">
                    <ErrorBoundary name="CrucibleRanks">
                      {crucibleRanks.map(
                        (progression) =>
                          progression && (
                            <CrucibleRank
                              key={progression.progressionHash}
                              defs={defs}
                              progress={progression}
                            />
                          )
                      )}
                    </ErrorBoundary>
                  </div>
                </div>
              </CollapsibleTitle>
            </section>
          </div>

          <section id="milestones">
            <CollapsibleTitle title={t('Progress.Milestones')} sectionId="milestones">
              <div className="progress-row">
                <ErrorBoundary name="Milestones">
                  <div className="progress-for-character" key={character.id}>
                    <WellRestedPerkIcon
                      defs={defs}
                      progressions={characterProgressions[character.id]}
                    />
                    <ErrorBoundary name="AccountMilestones">
                      {profileMilestones.map((milestone) => (
                        <Milestone
                          milestone={milestone}
                          characterClass={selectedStore.classType}
                          defs={defs}
                          key={milestone.milestoneHash}
                        />
                      ))}
                    </ErrorBoundary>
                    {this.milestonesForCharacter(character).map((milestone) => (
                      <Milestone
                        milestone={milestone}
                        characterClass={character.classType}
                        defs={defs}
                        key={milestone.milestoneHash}
                      />
                    ))}
                  </div>
                </ErrorBoundary>
              </div>
            </CollapsibleTitle>
          </section>

          <section id="raids">
            <CollapsibleTitle title={raidTitle} sectionId="raids">
              <div className="progress-row">
                <ErrorBoundary name="Raids">
                  <div className="progress-for-character" key={character.id}>
                    {this.raidsForCharacter(character).map((raid) => (
                      <Raid raid={raid} defs={defs} key={raid.milestoneHash} />
                    ))}
                  </div>
                </ErrorBoundary>
              </div>
            </CollapsibleTitle>
          </section>

          <ErrorBoundary name="Quests">
            {pursuitsOrder.map(
              (group) =>
                pursuits[group] && (
                  <section id={group} key={group}>
                    <CollapsibleTitle
                      title={t(`Progress.${group}`)}
                      sectionId={'pursuits-' + group}
                    >
                      <div className="progress-for-character">
                        {pursuits[group].sort(sortQuests).map((item) => (
                          <Pursuit item={item} key={item.index} />
                        ))}
                      </div>
                    </CollapsibleTitle>
                  </section>
                )
            )}
          </ErrorBoundary>

          <section id="triumphs">
            <ErrorBoundary name="Triumphs">
              <PresentationNodeRoot
                presentationNodeHash={1024788583}
                defs={defs}
                profileResponse={profileInfo}
              />
            </ErrorBoundary>
          </section>

          <hr />

          <section id="factions">
            <CollapsibleTitle title={t('Progress.Factions')} sectionId="progress-factions">
              <div className="progress-row">
                <ErrorBoundary name="Factions">
                  <div className="progress-for-character" key={character.id}>
                    {this.factionsForCharacter(character.id).map(
                      (faction) =>
                        profileInfo.profileInventory.data && (
                          <Faction
                            factionProgress={faction}
                            defs={defs}
                            characterId={character.id}
                            profileInventory={profileInfo.profileInventory.data}
                            key={faction.factionHash}
                            vendor={this.vendorForFaction(character.id, faction)}
                          />
                        )
                    )}
                  </div>
                </ErrorBoundary>
              </div>
            </CollapsibleTitle>
          </section>
        </PageWithMenu.Contents>
      </PageWithMenu>
    );
  }

  private onCharacterChanged = (storeId: string) => {
    this.setState({ selectedStoreId: storeId });
  };

  private vendorForFaction(
    characterId: string,
    faction: DestinyFactionProgression
  ): DestinyVendorComponent | undefined {
    if (faction.factionVendorIndex < 0) {
      return undefined;
    }

    const { defs } = this.props;
    if (!defs) {
      return undefined;
    }
    const { vendors } = this.state.progress!;
    const factionDef = defs.Faction[faction.factionHash];
    const vendorHash = factionDef.vendors[faction.factionVendorIndex].vendorHash;
    return vendors[characterId] && vendors[characterId].vendors.data
      ? vendors[characterId].vendors.data![vendorHash]
      : undefined;
  }

  /**
   * Get all the milestones that are valid across the whole profile. This still requires a character (any character)
   * to look them up, and the assumptions underlying this may get invalidated as the game evolves.
   */
  private milestonesForProfile(characterId: string): DestinyMilestone[] {
    const { defs } = this.props;
    const { profileInfo } = this.state.progress!;

    const allMilestones: DestinyMilestone[] = profileInfo.characterProgressions.data
      ? Object.values(profileInfo.characterProgressions.data[characterId].milestones)
      : [];

    const filteredMilestones = allMilestones.filter((milestone) => {
      return (
        !milestone.availableQuests &&
        !milestone.activities &&
        (milestone.vendors || milestone.rewards) &&
        defs &&
        defs.Milestone.get(milestone.milestoneHash)
      );
    });

    return _.sortBy(filteredMilestones, (milestone) => milestone.order);
  }

  /**
   * Get all the milestones to show for a particular character, filtered to active milestones and sorted.
   */
  private milestonesForCharacter(character: DimStore): DestinyMilestone[] {
    const { defs } = this.props;
    const { profileInfo } = this.state.progress!;

    const allMilestones: DestinyMilestone[] =
      profileInfo.characterProgressions &&
      profileInfo.characterProgressions.data &&
      profileInfo.characterProgressions.data[character.id]
        ? Object.values(profileInfo.characterProgressions.data[character.id].milestones)
        : [];

    const filteredMilestones = allMilestones.filter((milestone) => {
      const def = defs && defs.Milestone.get(milestone.milestoneHash);
      return (
        def &&
        (def.showInExplorer || def.showInMilestones) &&
        (milestone.activities ||
          (milestone.availableQuests &&
            milestone.availableQuests.every(
              (q) =>
                q.status.stepObjectives.length > 0 &&
                q.status.started &&
                (!q.status.completed || !q.status.redeemed)
            )))
      );
    });

    return _.sortBy(filteredMilestones, (milestone) => milestone.order);
  }

  private raidsForCharacter(character: DimStore): DestinyMilestone[] {
    const { defs } = this.props;
    const { profileInfo } = this.state.progress!;

    const allMilestones: DestinyMilestone[] =
      profileInfo.characterProgressions &&
      profileInfo.characterProgressions.data &&
      profileInfo.characterProgressions.data[character.id]
        ? Object.values(profileInfo.characterProgressions.data[character.id].milestones)
        : [];

    // filter to milestones with child activities of type <ActivityType "Raid" 2043403989>
    const filteredMilestones = allMilestones.filter((milestone) => {
      const def = defs && defs.Milestone.get(milestone.milestoneHash);
      return (
        def &&
        def.activities &&
        def.activities.some((activity) => {
          const activitydef = defs && defs.Activity.get(activity.activityHash);
          return (
            activitydef &&
            activitydef.activityTypeHash &&
            activitydef.activityTypeHash === 2043403989
          );
        })
      );
    });

    return _.sortBy(filteredMilestones, (f) => {
      const order = raidOrder.indexOf(f.milestoneHash);
      return order >= 0 ? order : 999 + f.order;
    });
  }

  /**
   * Get all the factions to show for a particular character.
   */
  private factionsForCharacter(characterId: string): DestinyFactionProgression[] {
    const { profileInfo } = this.state.progress!;

    const allFactions: DestinyFactionProgression[] = profileInfo.characterProgressions.data
      ? Object.values(profileInfo.characterProgressions.data[characterId].factions)
      : [];
    return _.sortBy(allFactions, (f) => {
      const order = factionOrder.indexOf(f.factionHash);
      return (order >= 0 ? order : 999) + (f.factionVendorIndex === -1 ? 1000 : 0);
    });
  }

  /**
   * Get all items in this character's inventory that represent quests - some are actual items that take
   * up inventory space, others are in the "Progress" bucket and need to be separated from the quest items
   * that represent milestones.
   */
  private questItems(store: DimStore): { [key: string]: DimItem[] } {
    const { defs } = this.props;
    if (!defs) {
      return {};
    }

    const filteredItems = store.buckets[1345459588].concat(
      // Include prophecy tablets, which are in consumables
      store.buckets[1345459588].filter((item) => item.itemCategoryHashes.includes(2250046497))
    );

    return _.groupBy(filteredItems, (item) => {
      const itemDef = defs.InventoryItem.get(item.hash);
      if (
        item.itemCategoryHashes.includes(16) ||
        item.itemCategoryHashes.includes(2250046497) ||
        (itemDef && itemDef.objectives && itemDef.objectives.questlineItemHash)
      ) {
        return 'Quests';
      }
      if (!item.objectives || item.objectives.length === 0 || (item.isDestiny2() && item.sockets)) {
        return 'Items';
      }
      // TODO: complete/expired

      return 'Bounties';
    });
  }
}

export default connect<StoreProps>(mapStateToProps)(Progress);
