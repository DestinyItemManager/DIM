import {
  DestinyFactionProgression,
  DestinyItemComponent,
  DestinyMilestone,
  DestinyObjectiveProgress,
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
import Quest from './Quest';
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
import Catalysts from 'app/collections/Catalysts';

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
    const { defs, stores, isPhonePortrait } = this.props;
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

    const { profileInfo } = progress;

    const selectedStore = selectedStoreId
      ? stores.find((s) => s.id === selectedStoreId)!
      : stores.find((s) => s.current)!;

    const profileMilestones = this.milestonesForProfile(selectedStore.id);
    const profileQuests = this.questItems(
      selectedStore.id,
      profileInfo.profileInventory.data ? profileInfo.profileInventory.data.items : []
    );

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

    const profileMilestonesContent = (profileMilestones.length > 0 || profileQuests.length > 0) && (
      <>
        <div className="profile-content">
          {profileMilestones.length > 0 && (
            <div className="section">
              <CollapsibleTitle
                title={t('Progress.ProfileMilestones')}
                sectionId="profile-milestones"
              >
                <div className="progress-row">
                  <div className="progress-for-character">
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
                  </div>
                </div>
              </CollapsibleTitle>
            </div>
          )}

          {profileQuests.length > 0 && (
            <div className="section">
              <CollapsibleTitle title={t('Progress.ProfileQuests')} sectionId="profile-quests">
                <div className="progress-row">
                  <div className="progress-for-character">
                    <ErrorBoundary name="AccountQuests">
                      {profileQuests.map((item) => (
                        <Quest
                          defs={defs}
                          item={item}
                          objectives={this.objectivesForItem(selectedStore.id, item)}
                          key={item.itemInstanceId ? item.itemInstanceId : item.itemHash}
                        />
                      ))}
                    </ErrorBoundary>
                  </div>
                </div>
              </CollapsibleTitle>
            </div>
          )}

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
      </>
    );

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
            <span>Catalysts</span>
          </PageWithMenu.MenuButton>
          <PageWithMenu.MenuButton href="#">
            <span>Factions</span>
          </PageWithMenu.MenuButton>
        </PageWithMenu.Menu>
        <PageWithMenu.Contents>
          {profileMilestonesContent}
          {this.renderCharacters([selectedStore])}
        </PageWithMenu.Contents>
      </PageWithMenu>
    );
  }

  private onCharacterChanged = (storeId: string) => {
    this.setState({ selectedStoreId: storeId });
  };

  /**
   * Render one or more characters. This could render them all, or just one at a time.
   */
  private renderCharacters(characters: DimStore[]) {
    const { profileInfo } = this.state.progress!;
    const { defs, buckets } = this.props;
    if (!defs || !buckets) {
      return null;
    }

    const pursuitsLabel = defs.InventoryBucket[1345459588].displayProperties.name;
    const characterProgressions = profileInfo.characterProgressions.data || {};
    const characterInventories = profileInfo.characterInventories.data || {};

    return (
      <>
        <div className="section">
          <CollapsibleTitle title={t('Progress.Milestones')} sectionId="milestones">
            <div className="progress-row">
              <ErrorBoundary name="Milestones">
                {characters.map((character) => (
                  <div className="progress-for-character" key={character.id}>
                    <WellRestedPerkIcon
                      defs={defs}
                      progressions={characterProgressions[character.id]}
                    />
                    {this.milestonesForCharacter(character).map((milestone) => (
                      <Milestone
                        milestone={milestone}
                        characterClass={character.classType}
                        defs={defs}
                        key={milestone.milestoneHash}
                      />
                    ))}
                  </div>
                ))}
              </ErrorBoundary>
            </div>
          </CollapsibleTitle>
        </div>

        <div className="section">
          <CollapsibleTitle title={pursuitsLabel} sectionId="pursuits">
            <div className="progress-row">
              <ErrorBoundary name="Quests">
                {characters.map((character) => (
                  <div className="progress-for-character" key={character.id}>
                    {this.questItems(character.id, characterInventories[character.id].items).map(
                      (item) => (
                        <Quest
                          defs={defs}
                          item={item}
                          objectives={this.objectivesForItem(character.id, item)}
                          key={item.itemInstanceId ? item.itemInstanceId : item.itemHash}
                        />
                      )
                    )}
                  </div>
                ))}
              </ErrorBoundary>
            </div>
          </CollapsibleTitle>
        </div>

        <div className="section">
          <CollapsibleTitle title={t('Vendors.Catalysts')} sectionId="progress-factions">
            <div className="progress-row">
              <ErrorBoundary name="Factions">
                <Catalysts defs={defs} buckets={buckets} profileResponse={profileInfo} />
              </ErrorBoundary>
            </div>
          </CollapsibleTitle>
        </div>

        <div className="section">
          <CollapsibleTitle title={t('Progress.Factions')} sectionId="progress-factions">
            <div className="progress-row">
              <ErrorBoundary name="Factions">
                {characters.map((character) => (
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
                ))}
              </ErrorBoundary>
            </div>
          </CollapsibleTitle>
        </div>
      </>
    );
  }

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
  private questItems(
    characterId: string,
    allItems: DestinyItemComponent[]
  ): DestinyItemComponent[] {
    const { defs } = this.props;
    if (!defs) {
      return [];
    }

    const filteredItems = allItems.filter((item) => {
      const itemDef = defs.InventoryItem.get(item.itemHash);

      if (!itemDef || itemDef.redacted) {
        return false;
      }

      // Pursuits
      if (itemDef.inventory && itemDef.inventory.bucketTypeHash === 1345459588) {
        return true;
      }

      // Also include prophecy tablets
      return itemDef.itemCategoryHashes && itemDef.itemCategoryHashes.includes(2250046497);
    });

    filteredItems.sort(
      chainComparator(
        compareBy((item) => {
          const objectives = this.objectivesForItem(characterId, item);
          const percentComplete = _.sumBy(objectives, (objective) => {
            if (objective.completionValue) {
              return (
                Math.min(1, (objective.progress || 0) / objective.completionValue) /
                objectives.length
              );
            } else {
              return 0;
            }
          });
          return percentComplete >= 1;
        }),
        compareBy((item) => {
          return item.expirationDate ? new Date(item.expirationDate) : new Date(8640000000000000);
        }),
        compareBy((item) => {
          const itemDef = defs.InventoryItem.get(item.itemHash);
          return itemDef.itemType;
        }),
        compareBy((item) => {
          // Sort by icon image, but only for bounties...
          const itemDef = defs.InventoryItem.get(item.itemHash);
          if (itemDef.itemCategoryHashes && itemDef.itemCategoryHashes.includes(1784235469)) {
            return itemDef.displayProperties.icon;
          } else {
            return undefined;
          }
        }),
        compareBy((item) => {
          const itemDef = defs.InventoryItem.get(item.itemHash);
          return itemDef.displayProperties.name;
        })
      )
    );
    return filteredItems;
  }

  /**
   * Get the list of objectives associated with a specific quest item. Sometimes these have their own objectives,
   * and sometimes they are disassociated and stored in characterProgressions.
   */
  private objectivesForItem(
    characterId: string,
    item: DestinyItemComponent
  ): DestinyObjectiveProgress[] {
    const { profileInfo } = this.state.progress!;

    const objectives =
      item.itemInstanceId && profileInfo.itemComponents.objectives.data
        ? profileInfo.itemComponents.objectives.data[item.itemInstanceId]
        : undefined;
    if (objectives) {
      return objectives.objectives;
    }
    return (
      (profileInfo.characterProgressions.data &&
        profileInfo.characterProgressions.data[characterId].uninstancedItemObjectives[
          item.itemHash
        ]) ||
      []
    );
  }
}

export default connect<StoreProps>(mapStateToProps)(Progress);
