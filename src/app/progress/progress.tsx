import * as React from 'react';
import * as _ from 'underscore';
import { ProgressService, ProgressProfile } from './progress.service';
import { IScope } from 'angular';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { Subscription } from '@reactivex/rxjs';
import { CharacterTile } from './character-tile';
import { Milestone } from './milestone';
import { Faction } from './faction';
import { Quest } from './quest';
import { IDestinyCharacterComponent, IDestinyMilestone, IDestinyProgression, IDestinyFactionProgression, IDestinyItemComponent, IDestinyInventoryComponent, IDestinyObjectiveProgress } from '../bungie-api/interfaces';
import { sum } from '../util';
import { t } from 'i18next';
import './progress.scss';

/* Label isn't used, but it helps us understand what each one is */
const progressionMeta = {
  611314723: { label: "Vanguard", order: 1 },
  3231773039: { label: "Vanguard Research", order: 2 },
  697030790: { label: "Crucible", order: 3 },
  1021210278: { label: "Gunsmith", order: 4 },

  4235119312: { label: "EDZ Deadzone Scout", order: 5 },
  4196149087: { label: "Titan Field Commander", order: 6 },
  1660497607: { label: "Nessus AI", order: 7 },
  828982195: { label: "Io Researcher", order: 8 },
  2677528157: { label: "Follower of Osiris", order: 9 },

  2105209711: { label: "New Monarchy", order: 10 },
  1714509342: { label: "Future War Cult", order: 11 },
  3398051042: { label: "Dead Orbit", order: 12 },
  3468066401: { label: "The Nine", order: 13 },
  1761642340: { label: "Iron Banner", order: 14 },

  1482334108: { label: "Leviathan", order: 15 }
};

interface Props {
  ProgressService: ProgressService;
  $scope: IScope;
  account: DestinyAccount;
  dimSettingsService;
}

interface State {
  progress?: ProgressProfile;
  characterOrder: string;
}

export class Progress extends React.Component<Props, State> {
  subscription: Subscription;

  constructor(props: Props) {
    super(props);
    this.state = {
      characterOrder: this.props.dimSettingsService.characterOrder
    };
  }

  componentDidMount() {
    this.subscription = this.props.ProgressService.getProgressStream(this.props.account).subscribe((progress) => {
      this.setState({ progress });
    });

    this.props.$scope.$on('dim-refresh', () => {
      this.props.ProgressService.reloadProgress();
    });

    this.props.$scope.$watch(() => this.props.dimSettingsService.characterOrder, (newValue) => {
      if (newValue != this.state.characterOrder) {
        this.setState({ characterOrder: newValue });
      }
    });
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  render() {
    if (!this.state.progress) {
      return <div className="progress dim-page">Loading...</div>;
    }

    const { defs, profileInfo, lastPlayedDate } = this.state.progress;

    // TODO: sort characters based on settings
    const characters = sortCharacters(Object.values(profileInfo.characters.data), this.state.characterOrder);

    // TODO: sorting these is a mystery
    function milestonesForCharacter(character): IDestinyMilestone[] {
      const allMilestones: IDestinyMilestone[] = Object.values(profileInfo.characterProgressions.data[character.characterId].milestones);
      return allMilestones.filter((milestone) => {
        return (milestone.availableQuests || []).every((q) => q.status.stepObjectives.length > 0 && q.status.started && (!q.status.completed || !q.status.redeemed));
      });
    }

    function factionsForCharacter(character): IDestinyFactionProgression[] {
      const allFactions: IDestinyFactionProgression[] = Object.values(profileInfo.characterProgressions.data[character.characterId].factions);
      return _.sortBy(allFactions, (f) => progressionMeta[f.factionHash] ? progressionMeta[f.factionHash].order : 999);
    }

    function questItemsForCharacter(character): IDestinyItemComponent[] {
      const allItems: IDestinyItemComponent[] = profileInfo.characterInventories.data[character.characterId].items;
      const filteredItems = allItems.filter((item) => {
        const itemDef = defs.InventoryItem.get(item.itemHash);
        // This required a lot of trial and error
        return itemDef.itemCategoryHashes.includes(16) || (itemDef.inventory && itemDef.inventory.tierTypeHash === 0 && itemDef.backgroundColor && itemDef.backgroundColor.alpha > 0);
      });
      return _.sortBy(filteredItems, (item) => {
        const itemDef = defs.InventoryItem.get(item.itemHash);
        return itemDef.displayProperties.name;
      });
    }

    function objectivesForItem(character: IDestinyCharacterComponent, item: IDestinyItemComponent): IDestinyObjectiveProgress[] {
      let objectives = profileInfo.itemComponents.objectives.data[item.itemInstanceId];
      if (objectives) {
        return objectives.objectives;
      }
      return profileInfo.characterProgressions.data[character.characterId].uninstancedItemObjectives[item.itemHash] || [];
    }

    return <div className="progress dim-page">
      <div className="progress-characters">
        {characters.map((character) =>
          <CharacterTile key={character.characterId}
                          character={character}
                          defs={defs}
                          lastPlayedDate={lastPlayedDate} />
        )}
      </div>

      <div className="section">
        <div className="title">{t('Progress.Milestones')}</div>
        <div className="progress-row">
          {characters.map((character) =>
            <div className="progress-for-character" key={character.characterId}>
              {milestonesForCharacter(character).map((milestone) =>
                <Milestone milestone={milestone} defs={defs} key={milestone.milestoneHash} />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="section">
        <div className="title">{t('Progress.Quests')}</div>
        <div className="progress-row">
          {characters.map((character) =>
            <div className="progress-for-character" key={character.characterId}>
              {questItemsForCharacter(character).map((item) =>
                <Quest defs={defs} item={item} objectives={objectivesForItem(character, item)} key={item.itemInstanceId ? item.itemInstanceId : item.itemHash}/>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="section">
        <div className="title">{t('Progress.Factions')}</div>
        <div className="progress-row">
          {characters.map((character) =>
            <div className="progress-for-character" key={character.characterId}>
              {factionsForCharacter(character).map((faction) =>
                <Faction factionProgress={faction} defs={defs} profileInventory={profileInfo.profileInventory.data} key={faction.factionHash} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>;
  }
}

export function sortCharacters(characters: IDestinyCharacterComponent[], order: string) {
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