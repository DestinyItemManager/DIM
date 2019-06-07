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
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';

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
  compareBy((item: DimItem) => {
    const objectives = item.objectives;
    const percentComplete = objectives
      ? _.sumBy(objectives, (objective) => {
          if (objective.completionValue) {
            return (
              Math.min(1, (objective.progress || 0) / objective.completionValue) / objectives.length
            );
          } else {
            return 0;
          }
        })
      : 0;
    return percentComplete >= 1;
  }),
  compareBy((item) => {
    return item.quest && item.quest.expirationDate
      ? item.quest.expirationDate
      : new Date(8640000000000000);
  }),
  compareBy((item) => item.typeName),
  compareBy((item) => {
    return item.icon;
  }),
  compareBy((item) => item.name)
);

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

    // TODO: select character, sidebar
    // TODO: Searchable (item, description)
    // TODO: break apart quests + bounties
    // TODO: move in catalysts
    // TODO: triumph search?
    // TODO: braytech triumphs
    // TODO: close / pinnacle triumphs?
    // TODO: progress bars on all headers
    // TODO: account wide separate?
    // TODO: dark square background on grid
    // TODO: truncate long descriptions
    // TODO: item popups for pursuits?
    // TODO: move clan engrams under regular milestones?
    // TODO: put ranks in sidebar?
    // TODO: tighter grid for factions
    // TODO: convert all this stuff into items!
    // TODO: move vendor load into faction component?
    // TODO: badge the corner of expired bounties (red background, clock)
    // TODO: show rewards in item popup
    // TODO: show "flavor text" in item popup (itemDef.displaySource)
    // TODO: should these be real items or have a distinct popup?? having them be real items makes them searchable but they still need extra data like rewards...
    // TODO: show tracked overlay
    // TODO: do our own display, don't need the full inventory item right?
    // TODO: break up into components!
    // TODO: grid the triumphs
    // TODO: fold clan milestones into the others
    // TODO: show expiration
    // TODO: separate milestones (daily, weekly, story?)

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
    // const characterInventories = profileInfo.characterInventories.data || {};
    const character = selectedStore;

    return (
      <PageWithMenu className="progress-page">
        <PageWithMenu.Menu>
          <a href="#">
            <span>Account Wide</span>
          </a>
          {selectedStore && (
            <CharacterSelect
              stores={stores}
              vertical={!isPhonePortrait}
              isPhonePortrait={isPhonePortrait}
              selectedStore={selectedStore}
              onCharacterChanged={this.onCharacterChanged}
            />
          )}
          <PageWithMenu.MenuButton href="#">
            <span>{t('Progress.Milestones')}</span>
          </PageWithMenu.MenuButton>
          <PageWithMenu.MenuButton href="#">
            <span>Bounties</span>
          </PageWithMenu.MenuButton>
          <PageWithMenu.MenuButton href="#">
            <span>Quests</span>
          </PageWithMenu.MenuButton>
          <PageWithMenu.MenuButton href="#">
            <span>Quest Items</span>
          </PageWithMenu.MenuButton>
          <PageWithMenu.MenuButton href="#">
            <span>Factions</span>
          </PageWithMenu.MenuButton>
          <PageWithMenu.MenuButton href="#">
            <span>Braytech</span>
          </PageWithMenu.MenuButton>
          <PageWithMenu.MenuButton href="#">
            <span>DestinySets</span>
          </PageWithMenu.MenuButton>
        </PageWithMenu.Menu>
        <PageWithMenu.Contents>
          <div className="profile-content">
            <div className="section crucible-ranks">
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
            </div>
          </div>
          <div className="section">
            <ErrorBoundary name="Triumphs">
              <PresentationNodeRoot
                presentationNodeHash={1024788583}
                defs={defs}
                profileResponse={profileInfo}
              />
            </ErrorBoundary>
          </div>

          <hr />

          <div className="section">
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
          </div>

          <div className="section">
            <ErrorBoundary name="Quests">
              {_.map(this.questItems(character), (items, group) => (
                <CollapsibleTitle title={group} sectionId={'pursuits-' + group} key={group}>
                  <div className="progress-for-character">
                    {items.sort(sortQuests).map((item) => (
                      <div className="milestone-quest" key={item.index}>
                        <div className="milestone-icon">
                          <ItemPopupTrigger item={item}>
                            <ConnectedInventoryItem item={item} allowFilter={true} />
                          </ItemPopupTrigger>
                        </div>
                        <div className="milestone-info">
                          <span className="milestone-name">{item.name}</span>
                          <div className="milestone-description">{item.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleTitle>
              ))}
            </ErrorBoundary>
          </div>

          <div className="section">
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
          </div>
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
        return 'quests';
      }
      if (!item.objectives || item.objectives.length === 0 || (item.isDestiny2() && item.sockets)) {
        return 'items';
      }
      // TODO: complete/expired

      return 'bounties';
    });
  }
}

export default connect<StoreProps>(mapStateToProps)(Progress);
