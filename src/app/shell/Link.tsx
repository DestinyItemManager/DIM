import * as React from 'react';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { $transitions, $state } from '../ngimport-more';
import { t } from 'i18next';

export default class Link extends React.PureComponent<{
  account?: DestinyAccount;
  state: string;
  text?: string;
}, {
  active: boolean;
}> {
  private listener;

  constructor(props) {
    super(props);
    this.state = { active: false };
  }

  componentDidMount() {
    this.listener = $transitions.onEnter({}, (_transition, state) => {
      this.setState({ active: (state.name === this.props.state) });
    });
  }

  componentWillUnmount() {
    this.listener();
  }

  render() {
    const { text, children } = this.props;
    const { active } = this.state;

    return (
      <a className={active ? 'link active' : 'link'} onClick={this.clicked}>{children}{text && t(text)}</a>
    );
  }

  private clicked = () => {
    const { state, account } = this.props;
    $state.go(state, account);
  }
}
