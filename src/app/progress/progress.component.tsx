import * as React from 'react';
import { ProgressService, ProgressProfile } from './progress.service';
import { IScope } from 'angular';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { Subscription } from '@reactivex/rxjs';
import { CharacterTile } from './character-tile';
import { IDestinyMilestone, IDestinyMilestoneQuest, IDestinyDisplayPropertiesDefinition } from '../bungie-api/interfaces';

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
      console.log(progress);
      this.setState({ progress });
    });
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  render() {
    if (!this.state.progress) {
      return <div className="activities dim-page">Loading...</div>;
    }

    const { defs, profileInfo, lastPlayedDate } = this.state.progress;

    // TODO: sort characters based on settings
    const characters = Object.values(profileInfo.characters.data);

    const milestonesPerCharacter: IDestinyMilestone[][] = characters.map((character) => Object.values(profileInfo.characterProgressions.data[character.characterId].milestones));

    return <div className="activities dim-page">
      <div className="activities-characters">
        {characters.map((character) =>
          <div className="activities-character" key={character.characterId}>
            <CharacterTile character={character}
                           defs={defs}
                           lastPlayedDate={lastPlayedDate} />
          </div>
        )}
      </div>

      <div className="activity-info">
        <div className="activity-progress">
          <div className="tier-characters">
            {milestonesPerCharacter.map((milestones) =>
              <div className="tier-row">
                {milestones.map((milestone) =>
                  <Milestone milestone={milestone} defs={defs} key={milestone.milestoneHash} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>;
  }
}

interface MilestoneProps {
  milestone: IDestinyMilestone;
  defs;
}

function Milestone(props: MilestoneProps) {
  const { milestone, defs } = props;

  // TODO: no typings for manifest types yet
  const milestoneDef = defs.Milestone.get(milestone.milestoneHash);

  console.log({milestone, milestoneDef})

  // TODO: there are also "vendor milestones" which have no quest but have vendors (Xur)

  return <div>
    {(milestone.availableQuests || []).map((availableQuest) =>
      <AvailableQuest defs={defs} milestoneDef={milestoneDef} availableQuest={availableQuest} key={availableQuest.questItemHash} />
    )}
  </div>;

 {/*
  return <div className="activity section">
    <div className="title activity-header">
      <img className="small-icon" src={`https://www.bungie.net${milestoneDef.displayProperties.icon}`} />
      <span className="activity-name">{milestoneDef.displayProperties.name}</span>
    </div>
    <div className="activity-info" ng-if="!$ctrl.settings.collapsedSections['activities-' + activity.hash]">
      <div className="activity-progress" ng-repeat="tier in activity.tiers track by $index">
        <div className="tier-title" ng-if="activity.tiers.length > 1">{{ ::tier.name }}</div>
        <div className="tier-characters">
          <div className="tier-row" ng-if="tier.characters.length" ng-repeat="character in tier.characters | sortStores:$ctrl.settings.characterOrder track by character.id">
            <span className="step-icon" ng-className="{ complete: step.complete }" ng-repeat="step in character.steps track by $index"></span>
          </div>
        </div>
      </div>
    </div>
  </div>;
 */}
}

interface AvailableQuestProps {
  defs;
  milestoneDef;
  availableQuest: IDestinyMilestoneQuest;
}

function AvailableQuest(props: AvailableQuestProps) {
  const { defs, milestoneDef, availableQuest } = props;

  const questDef = milestoneDef.quests[availableQuest.questItemHash];
  const displayProperties: IDestinyDisplayPropertiesDefinition = questDef.displayProperties || milestoneDef.displayProperties;

  // TODO: some quests don't have a description, but they have an Activity (questDef.activities)!

  return <div>
    <img className="small-icon" src={`https://www.bungie.net${displayProperties.icon}`} />
    <span className="activity-name">{displayProperties.name}</span>
    <p>{displayProperties.description}</p>
  </div>;
}