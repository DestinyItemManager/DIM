import { Subscription } from 'rxjs/Subscription';
import { IScope } from 'angular';
import { t } from 'i18next';
import * as React from 'react';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { isPhonePortrait, isPhonePortraitStream } from '../mediaQueries';
import { settings, CharacterOrder } from '../settings/settings';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import { $rootScope } from 'ngimport';
import { Loading } from '../dim-ui/Loading';
import { ProgressProfile, getProgressStream, reloadProgress } from '../progress/progress.service';
import { ChecklistCategory } from './ChecklistCategory';

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

export class Checklist extends React.Component<Props, State> {
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

    const profileProgressionHashes = Object.keys(profileInfo.profileProgression.data.checklists).map(Number);

    return (
      <div className="section checklists">
        <div className="checklist-row">
          <ErrorBoundary name="checklists">
            {profileProgressionHashes.map((pph) =>
              <ChecklistCategory
                key={pph}
                checklistDefinitionHash={pph}
                profileChecklist={profileInfo.profileProgression.data.checklists}
                defs={defs}
              />)}
          </ErrorBoundary>
        </div>
      </div>
    );
  }
}
