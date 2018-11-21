import { t } from 'i18next';
import * as React from 'react';
import ClickOutside from '../dim-ui/ClickOutside';
import { loadingTracker } from '../shell/loading-tracker';
import { removeToken } from '../oauth/oauth-token.service';
import './account-select.scss';
import { compareAccounts, DestinyAccount } from './destiny-account.service';
import { getPlatforms } from './platform.service';
import classNames from 'classnames';
import { UISref } from '@uirouter/react';
import { router } from '../../router';
import { AppIcon, signOutIcon } from '../shell/icons';

const Account = React.forwardRef(
  (
    {
      account,
      className,
      ...other
    }: {
      account: DestinyAccount;
      className?: string;
    } & React.HTMLAttributes<HTMLDivElement>,
    ref?: React.Ref<HTMLDivElement>
  ) => {
    return (
      <div ref={ref} className={classNames('account', className)} {...other}>
        <div className="account-name">
          Destiny {account.destinyVersion === 1 ? '1' : '2'} •{' '}
          <span>{t(`Accounts.${account.platformLabel}`)}</span>
        </div>
        <div className="account-details">{account.displayName}</div>
      </div>
    );
  }
);

interface Props {
  currentAccount?: DestinyAccount;
}

interface State {
  open: boolean;
  accounts: DestinyAccount[];
}

export default class AccountSelect extends React.Component<Props, State> {
  private dropdownToggler = React.createRef<HTMLDivElement>();
  // tslint:disable-next-line:ban-types
  private unregisterTransitionHooks: Function[] = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      open: false,
      accounts: []
    };
  }

  componentDidMount() {
    const loadAccountsPromise = getPlatforms().then((accounts) => this.setState({ accounts }));
    loadingTracker.addPromise(loadAccountsPromise);

    this.unregisterTransitionHooks = [
      router.transitionService.onBefore({}, () => {
        this.closeDropdown();
      })
    ];
  }

  componentWillUnmount() {
    this.unregisterTransitionHooks.forEach((f) => f());
  }

  render() {
    const { currentAccount } = this.props;
    const { open, accounts } = this.state;

    if (!currentAccount) {
      return null;
    }

    const otherAccounts = accounts.filter((p) => !compareAccounts(p, currentAccount));

    return (
      <div className="account-select">
        <Account
          className="selected-account"
          ref={this.dropdownToggler}
          account={currentAccount}
          onClick={this.toggleDropdown}
        />
        {open && (
          <ClickOutside onClickOutside={this.closeDropdown} className="accounts-popup">
            {otherAccounts.map((account) => (
              <UISref
                key={`${account.membershipId}-${account.destinyVersion}`}
                to={account.destinyVersion === 1 ? 'destiny1' : 'destiny2'}
                params={account}
                onClick={this.closeDropdown}
              >
                <Account account={account} onClick={this.closeDropdown} />
              </UISref>
            ))}
            <div className="log-out" onClick={this.logOut}>
              <AppIcon icon={signOutIcon} />
              &nbsp;
              {t('Settings.LogOut')}
            </div>
          </ClickOutside>
        )}
      </div>
    );
  }

  private closeDropdown = (e?) => {
    if (!e || !this.dropdownToggler.current || !this.dropdownToggler.current.contains(e.target)) {
      this.setState({ open: false });
    }
  };

  private toggleDropdown = () => {
    this.setState({ open: !this.state.open });
  };

  private logOut = () => {
    this.closeDropdown();
    removeToken();
    router.stateService.go('login', { reauth: true });
  };
}
