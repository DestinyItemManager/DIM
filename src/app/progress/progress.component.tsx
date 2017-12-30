import * as React from 'react';
import { ProgressService, ProgressProfile } from './progress.service';
import { IScope } from 'angular';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { Subscription } from '@reactivex/rxjs';

interface Props {
  ProgressService: ProgressService;
  $scope: IScope;
  account: DestinyAccount;
}

interface State {
  progress: ProgressProfile | null
}

export class Progress extends React.Component<Props, State> {
  state = {
    progress: null
  };

  subscription: Subscription;
  componentDidMount() {
    console.log('PROPS', this.props);
    this.subscription = this.props.ProgressService.getProgressStream(this.props.account).subscribe((progress) => {
      console.log(progress);
      this.setState({ progress });
    });
  }
  render() {
    return <div>HELLO ${JSON.stringify(this.state.progress)}</div>
  }
}