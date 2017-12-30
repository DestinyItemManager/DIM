import * as React from 'react';
import { ProgressService } from './progress.service';
import { IScope } from 'angular';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { Subscription } from '@reactivex/rxjs';

interface Props {
  ProgressService: ProgressService;
  $scope: IScope;
  account: DestinyAccount;
}

export class Progress extends React.Component<Props> {
  subscription: Subscription;
  state = {
    data: ''
  }
  componentDidMount() {
    console.log('PROPS', this.props);
    this.subscription = this.props.ProgressService.getProgressStream(this.props.account).subscribe((stores) => {
      console.log(stores);
    });
  }
  render() {
    return <div>HELLO</div>
  }
}