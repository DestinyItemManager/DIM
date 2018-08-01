import { Subscription } from 'rxjs/Subscription';
import { IScope } from 'angular';
import {
  DestinyCharacterComponent,
  DestinyFactionProgression,
  DestinyItemComponent,
  DestinyMilestone,
  DestinyObjectiveProgress,
  DestinyVendorComponent,
} from 'bungie-api-ts/destiny2';
import { t } from 'i18next';
import * as React from 'react';
import {
  Frame,
  Track,
  View,
  ViewPager
  } from 'react-view-pager';
import * as _ from 'underscore';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { isPhonePortrait, isPhonePortraitStream } from '../mediaQueries';
import CharacterTile, { characterIsCurrent } from './CharacterTile';
import { Faction } from './Faction';
import { Milestone } from './Milestone';
import './progress.scss';
import { ProgressProfile, reloadProgress, getProgressStream } from './progress.service';
import Quest from './Quest';
import { settings, CharacterOrder } from '../settings/settings';
import WellRestedPerkIcon from './WellRestedPerkIcon';
import { CrucibleRank } from './CrucibleRank';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import { $rootScope } from 'ngimport';
import { Loading } from '../dim-ui/Loading';
import Link from '../shell/Link';

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

interface Props {
  $scope: IScope;
  account: DestinyAccount;
}

interface State {
  progress?: ProgressProfile;
  characterOrder: CharacterOrder;
  isPhonePortrait: boolean;
  currentCharacterId: string;
}

export default class Progress extends React.Component<Props, State> {
  subscription: Subscription;
  mediaQuerySubscription: Subscription;
  private $scope = $rootScope.$new(true);

  constructor(props: Props) {
    super(props);
    this.state = {
      characterOrder: settings.characterOrder,
      isPhonePortrait: isPhonePortrait(),
      currentCharacterId: ""
    };
  }

  componentDidMount() {
    this.subscription = getProgressStream(this.props.account).subscribe((progress) => {
      this.setState((prevState) => {
        const updatedState = {
          progress,
          currentCharacterId: prevState.currentCharacterId
        };
        if (prevState.currentCharacterId === "") {
          const characters = this.sortedCharacters(progress, prevState.characterOrder);
          if (characters.length) {
            const lastPlayedDate = progress.lastPlayedDate;
            updatedState.currentCharacterId = characters.find((c) => characterIsCurrent(c, lastPlayedDate))!.characterId;
          }
        }

        return updatedState;
      });
    });

    this.mediaQuerySubscription = isPhonePortraitStream().subscribe((phonePortrait: boolean) => {
      if (phonePortrait !== this.state.isPhonePortrait) {
        this.setState({ isPhonePortrait: phonePortrait });
      }
    });

    this.$scope.$on('dim-refresh', () => {
      reloadProgress();
    });

    this.$scope.$watch(() => settings.characterOrder, (newValue: CharacterOrder) => {
      if (newValue !== this.state.characterOrder) {
        this.setState({ characterOrder: newValue });
      }
    });
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.$scope.$destroy();
  }

  render() {
    if (!this.state.progress) {
      return <div className="progress-page dim-page"><Loading/></div>;
    }

    const { defs, profileInfo } = this.state.progress;

    const characters = this.sortedCharacters();

    const profileMilestones = this.milestonesForProfile(characters[0]);
    const profileQuests = this.questItems(profileInfo.profileInventory.data.items);

    const firstCharacterProgression = Object.values(profileInfo.characterProgressions.data)[0].progressions;
    const crucibleRanks = [
      // Valor
      firstCharacterProgression[3882308435],
      // Glory
      firstCharacterProgression[2679551909]
    ];

    const profileProgressionHashes = Object.keys(profileInfo.profileProgression.data.checklists).map(Number);

    const profileMilestonesContent = (profileMilestones.length > 0 || profileQuests.length > 0) && (
      <>
        <div className="profile-content">
          {profileMilestones.length > 0 && <div className="section">
            <div className="title">{t('Progress.ProfileMilestones')}</div>
            <div className="progress-row">
              <div className="progress-for-character">
                <ErrorBoundary name="AccountMilestones">
                  {profileMilestones.map((milestone) =>
                    <Milestone milestone={milestone} character={characters[0]} defs={defs} key={milestone.milestoneHash} />
                  )}
                  {profileProgressionHashes && (<>
                    <div className="milestone-quest">
                      <div className="milestone-icon">
                        <i className="fa fa-calendar-check-o fa-3x" aria-hidden="true"/>
                      </div>
                      {$featureFlags.profileProgressions && <Link
                        key='destiny2.checklist'
                        account={this.props.account}
                        state='destiny2.checklist'
                        text='Progress.Checklists'
                      />}
                    </div>
                  </>)}
                </ErrorBoundary>
              </div>
            </div>
          </div>}

          {profileQuests.length > 0 && <div className="section">
            <div className="title">{t('Progress.ProfileQuests')}</div>
            <div className="progress-row">
                <div className="progress-for-character">
                  <ErrorBoundary name="AccountQuests">
                    {profileQuests.map((item) =>
                      <Quest defs={defs} item={item} objectives={this.objectivesForItem(characters[0], item)} key={item.itemInstanceId ? item.itemInstanceId : item.itemHash}/>
                    )}
                  </ErrorBoundary>
                </div>
            </div>
          </div>}

          <div className="section crucible-ranks">
            <div className="title">{t('Progress.CrucibleRank')}</div>
            <div className="progress-row">
              <div className="progress-for-character">
                <ErrorBoundary name="CrucibleRanks">
                  {crucibleRanks.map((progression) =>
                    <CrucibleRank
                      key={progression.progressionHash}
                      defs={defs}
                      progress={progression}
                    />
                  )}
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </div>
        <hr/>
      </>
    );

    if (this.state.isPhonePortrait) {
      return (
        <div className="progress-page dim-page">
          {profileMilestonesContent}
          <ViewPager>
            <Frame className="frame" autoSize={true}>
              <Track
                currentView={this.state.currentCharacterId}
                viewsToShow={1}
                contain={true}
                className="track"
                flickTimeout={100}
              >
                {characters.map((character) =>
                  <View className="view" key={character.characterId}>{this.renderCharacters([character])}</View>
                )}
              </Track>
            </Frame>
          </ViewPager>
        </div>
      );
    } else {
      return (
        <div className="progress-page dim-page">
          {profileMilestonesContent}
          {this.renderCharacters(characters)}
        </div>
      );
    }
  }

  /**
   * Render one or more characters. This could render them all, or just one at a time.
   */
  private renderCharacters(characters: DestinyCharacterComponent[]) {
    const { defs, profileInfo, lastPlayedDate } = this.state.progress!;

    return (
      <>
        <div className="progress-characters">
          {characters.map((character) =>
            <CharacterTile
              key={character.characterId}
              character={character}
              defs={defs}
              lastPlayedDate={lastPlayedDate}
            />
          )}
        </div>

        <div className="section">
          <div className="title">{t('Progress.Milestones')}</div>
          <div className="progress-row">
            <ErrorBoundary name="Milestones">
              {characters.map((character) =>
                <div className="progress-for-character" key={character.characterId}>
                  <WellRestedPerkIcon defs={defs} progressions={profileInfo.characterProgressions.data[character.characterId]} />
                  {this.milestonesForCharacter(character).map((milestone) =>
                    <Milestone milestone={milestone} character={character} defs={defs} key={milestone.milestoneHash} />
                  )}
                </div>
              )}
            </ErrorBoundary>
          </div>
        </div>

        <div className="section">
          <div className="title">{t('Progress.Quests')}</div>
          <div className="progress-row">
            <ErrorBoundary name="Quests">
              {characters.map((character) =>
                <div className="progress-for-character" key={character.characterId}>
                  {this.questItems(profileInfo.characterInventories.data[character.characterId].items).map((item) =>
                    <Quest defs={defs} item={item} objectives={this.objectivesForItem(character, item)} key={item.itemInstanceId ? item.itemInstanceId : item.itemHash}/>
                  )}
                </div>
              )}
            </ErrorBoundary>
          </div>
        </div>

        <div className="section">
          <div className="title">{t('Progress.Factions')}</div>
          <div className="progress-row">
            <ErrorBoundary name="Factions">
              {characters.map((character) =>
                <div className="progress-for-character" key={character.characterId}>
                  {this.factionsForCharacter(character).map((faction) =>
                    <Faction
                      factionProgress={faction}
                      defs={defs}
                      character={character}
                      profileInventory={profileInfo.profileInventory.data}
                      key={faction.factionHash}
                      vendor={this.vendorForFaction(character, faction)}
                    />
                  )}
                </div>
              )}
            </ErrorBoundary>
          </div>
        </div>
      </>
    );
  }

  /**
   * The list of characters in the current (or provided) state, ordered in the preferred way.
   */
  private sortedCharacters(progress: ProgressProfile = this.state.progress!, characterOrder: CharacterOrder = this.state.characterOrder): DestinyCharacterComponent[] {
    return sortCharacters(Object.values(progress.profileInfo.characters.data), characterOrder);
  }

  private vendorForFaction(character: DestinyCharacterComponent, faction: DestinyFactionProgression): DestinyVendorComponent | undefined {
    if (faction.factionVendorIndex < 0) {
      return undefined;
    }

    const { vendors, defs } = this.state.progress!;
    const factionDef = defs.Faction[faction.factionHash];
    const vendorHash = factionDef.vendors[faction.factionVendorIndex].vendorHash;
    return vendors[character.characterId].vendors.data[vendorHash];
  }

  /**
   * Get all the milestones that are valid across the whole profile. This still requires a character (any character)
   * to look them up, and the assumptions underlying this may get invalidated as the game evolves.
   */
  private milestonesForProfile(character: DestinyCharacterComponent): DestinyMilestone[] {
    const { defs, profileInfo } = this.state.progress!;

    const allMilestones: DestinyMilestone[] = Object.values(profileInfo.characterProgressions.data[character.characterId].milestones);

    const filteredMilestones = allMilestones.filter((milestone) => {
      return !milestone.availableQuests &&
        (milestone.vendors || milestone.rewards) &&
        defs.Milestone.get(milestone.milestoneHash);
    });

    // Sort them alphabetically by name
    return _.sortBy(filteredMilestones, (milestone) => {
      const milestoneDef = defs.Milestone.get(milestone.milestoneHash);
      return milestoneDef.displayProperties.name;
    });
  }

  /**
   * Get all the milestones to show for a particular character, filtered to active milestones and sorted.
   */
  private milestonesForCharacter(character: DestinyCharacterComponent): DestinyMilestone[] {
    const { defs, profileInfo } = this.state.progress!;

    const allMilestones: DestinyMilestone[] = Object.values(profileInfo.characterProgressions.data[character.characterId].milestones);

    const filteredMilestones = allMilestones.filter((milestone) => {
      return milestone.availableQuests && milestone.availableQuests.every((q) =>
            q.status.stepObjectives.length > 0 &&
            q.status.started &&
            (!q.status.completed || !q.status.redeemed));
    });

    // Sort them alphabetically by name
    return _.sortBy(filteredMilestones, (milestone) => {
      const milestoneDef = defs.Milestone.get(milestone.milestoneHash);
      if (milestoneDef && milestoneDef.displayProperties) {
        return milestoneDef.displayProperties.name;
      } else if (milestone.availableQuests) {
        const questDef = milestoneDef.quests[milestone.availableQuests[0].questItemHash];
        return questDef.displayProperties.name;
      }
    });
  }

  /**
   * Get all the factions to show for a particular character.
   */
  private factionsForCharacter(character: DestinyCharacterComponent): DestinyFactionProgression[] {
    const { profileInfo } = this.state.progress!;

    const allFactions: DestinyFactionProgression[] = Object.values(profileInfo.characterProgressions.data[character.characterId].factions);
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
  private questItems(allItems: DestinyItemComponent[]): DestinyItemComponent[] {
    const { defs } = this.state.progress!;

    // const allItems: DestinyItemComponent[] = profileInfo.characterInventories.data[character.characterId].items.concat(profileInfo.profileInventory.data.items);
    const filteredItems = allItems.filter((item) => {
      const itemDef = defs.InventoryItem.get(item.itemHash);

      // Pursuits
      if (itemDef.inventory && itemDef.inventory.bucketTypeHash === 1345459588) {
        return true;
      }

      // This required a lot of trial and error.
      return (itemDef.itemCategoryHashes &&
          (
            itemDef.itemCategoryHashes.includes(16) ||
            itemDef.itemCategoryHashes.includes(2250046497)
          )
        ) ||
        (itemDef.inventory && itemDef.inventory.tierTypeHash === 0 &&
          itemDef.backgroundColor && itemDef.backgroundColor.alpha > 0);
    });
    return _.sortBy(filteredItems, (item) => {
      const itemDef = defs.InventoryItem.get(item.itemHash);
      return itemDef.displayProperties.name;
    });
  }

  /**
   * Get the list of objectives associated with a specific quest item. Sometimes these have their own objectives,
   * and sometimes they are disassociated and stored in characterProgressions.
   */
  private objectivesForItem(character: DestinyCharacterComponent, item: DestinyItemComponent): DestinyObjectiveProgress[] {
    const { profileInfo } = this.state.progress!;

    const objectives = item.itemInstanceId ? profileInfo.itemComponents.objectives.data[item.itemInstanceId] : undefined;
    if (objectives) {
      return objectives.objectives;
    }
    return profileInfo.characterProgressions.data[character.characterId].uninstancedItemObjectives[item.itemHash] || [];
  }
}

/**
 * Sort a list of characters by a specified sorting method.
 */
export function sortCharacters(characters: DestinyCharacterComponent[], order: CharacterOrder) {
  if (order === 'mostRecent') {
    return _.sortBy(characters, (store) => {
      return -1 * new Date(store.dateLastPlayed).getTime();
    });
  } else if (order === 'mostRecentReverse') {
    return _.sortBy(characters, (store) => {
      return new Date(store.dateLastPlayed).getTime();
    });
  } else {
    return characters;
  }
}
