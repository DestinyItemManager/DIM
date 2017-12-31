import * as React from 'react';
import * as _ from 'underscore';
import { ProgressService, ProgressProfile } from './progress.service';
import { IScope } from 'angular';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { Subscription } from '@reactivex/rxjs';
import { CharacterTile } from './character-tile';
import { Milestone } from './milestone';
import { Faction } from './faction';
import { IDestinyMilestone, IDestinyProgression, IDestinyFactionProgression } from '../bungie-api/interfaces';
import { progressionMeta } from '../inventory/d2-stores.service';
import { sum } from '../util';
import './progress.scss';

interface Props {
  ProgressService: ProgressService;
  $scope: IScope;
  account: DestinyAccount;
}

interface State {
  progress?: ProgressProfile
}

export class Progress extends React.Component<Props, State> {
  state: State = {};

  subscription: Subscription;

  componentDidMount() {
    this.subscription = this.props.ProgressService.getProgressStream(this.props.account).subscribe((progress) => {
      console.log({progress});
      this.setState({ progress });
    });

    this.props.$scope.$on('dim-refresh', () => {
      this.props.ProgressService.reloadProgress();
    })
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
    const characters = Object.values(profileInfo.characters.data);

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
        <div className="title">Milestones</div>
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
        <div className="title">Factions</div>
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