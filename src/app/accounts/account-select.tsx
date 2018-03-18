import { t } from 'i18next';
import * as React from 'react';
import ClickOutside from '../dim-ui/click-outside';
import { $state, loadingTracker } from '../ngimport-more';
import { removeToken } from '../oauth/oauth-token.service';
import './account-select.scss';
import { compareAccounts, DestinyAccount } from './destiny-account.service';
import { getPlatforms } from './platform.service';
import classNames from 'classnames';

interface Props {
  currentAccount?: DestinyAccount;
}

interface State {
  open: boolean;
  accounts: DestinyAccount[];
}

export default class AccountSelect extends React.Component<Props, State> {
  private dropdownToggler: HTMLElement | null;

  constructor(props) {
    super(props);
    this.state = {
      open: false,
      accounts: []
    };
  }

  componentDidMount() {
    const loadAccountsPromise = getPlatforms().then((accounts) => this.setState({ accounts }));
    loadingTracker.addPromise(loadAccountsPromise);
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
        <Account className="selected-account" innerRef={this.captureDropdownToggler} account={currentAccount} onClick={this.toggleDropdown}/>
        {open &&
          <ClickOutside onClickOutside={this.closeDropdown} className="accounts-popup">
            {otherAccounts.map((account) =>
              // tslint:disable-next-line:jsx-no-lambda
              <Account key={`${account.membershipId}-${account.destinyVersion}`} account={account} onClick={() => this.selectAccount(account)}/>
            )}
            <div className="log-out" onClick={this.logOut}><i className="fa fa-sign-out"/> {t('Settings.LogOut')}</div>
          </ClickOutside>
        }
      </div>
    );
  }

  private captureDropdownToggler = (ref: HTMLElement | null) => {
    this.dropdownToggler = ref;
  }

  private closeDropdown = (e?) => {
    if (!e || !this.dropdownToggler || !this.dropdownToggler.contains(e.target)) {
      this.setState({ open: false });
    }
  }

  private toggleDropdown = () => {
    this.setState({ open: !this.state.open });
  }

  private selectAccount = (account: DestinyAccount) => {
    this.closeDropdown();
    $state.go(account.destinyVersion === 1 ? 'destiny1' : 'destiny2', account);
  }

  private logOut = () => {
    this.closeDropdown();
    removeToken();
    $state.go('login', { reauth: true });
  }
}

function Account({
  account,
  className,
  innerRef,
  ...other
}: {
  account: DestinyAccount;
  className?: string;
  innerRef?: React.Ref<HTMLElement>;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div ref={innerRef} className={classNames("account", className)} {...other}>
      <div className="account-name">
        Destiny {account.destinyVersion === 1 ? '1' : '2'}
        •
        <span>{t(`Accounts.${account.platformLabel}`)}</span>
      </div>
      <div className="account-details">{account.displayName}</div>
    </div>
  );
}
