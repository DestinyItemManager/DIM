import * as React from 'react';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { t } from 'i18next';
import { UISrefActive, UISref } from '@uirouter/react';
import { router } from '../../router';

interface Props {
  account?: DestinyAccount;
  state: string;
  text?: string;
  children?: React.ReactChild;
}

interface State {
  generation: number;
}

export default class Link extends React.Component<Props, State> {
  // tslint:disable-next-line:ban-types
  private unregisterTransitionHooks: Function[] = [];

  constructor(props) {
    super(props);
    this.state = {
      generation: 0
    };
  }

  componentDidMount() {
    this.unregisterTransitionHooks = [
      router.stateRegistry.onStatesChanged(() => {
        this.setState((state) => {
          return { generation: state.generation + 1 };
        });
      })
    ];
  }

  componentWillUnmount() {
    this.unregisterTransitionHooks.forEach((f) => f());
  }

  render() {
    const { state, account, children, text } = this.props;

    // This should be a really simple component, but because of https://github.com/ui-router/react/issues/204
    // it can't handle lazy states, and we need to use "key" to nuke the whole component tree on updates.

    return (
      <UISrefActive key={this.state.generation} class="active">
        <UISref to={state} params={account}>
          <a className="link">
            {children}
            {text && t(text)}
          </a>
        </UISref>
      </UISrefActive>
    );
  }
}
