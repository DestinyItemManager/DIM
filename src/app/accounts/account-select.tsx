import { t } from 'app/i18next-t';
import React from 'react';
import ClickOutside from '../dim-ui/ClickOutside';
import { removeToken } from '../oauth/oauth-token.service';
import './account-select.scss';
import { compareAccounts, DestinyAccount } from './destiny-account.service';
import { getPlatforms } from './platform.service';
import classNames from 'classnames';
import { UISref } from '@uirouter/react';
import { router } from '../../router';
import { AppIcon, signOutIcon } from '../shell/icons';
import { loadAccountsFromIndexedDB, currentAccountSelector, accountsSelector } from './reducer';
import { connect } from 'react-redux';
import { RootState } from 'app/store/reducers';

function AccountComp(
  {
    account,
    className,
    ...other
  }: {
    account: DestinyAccount;
    className?: string;
  } & React.HTMLAttributes<HTMLDivElement>,
  ref?: React.Ref<HTMLDivElement>
) {
  return (
    <div ref={ref} className={classNames('account', className)} {...other} role="menuitem">
      <div className="account-name">
        Destiny {account.destinyVersion === 1 ? '1' : '2'} •{' '}
        <span>{t(`Accounts.${account.platformLabel}`)}</span>
        {/*
          t('Accounts.PlayStation')
          t('Accounts.Xbox')
          t('Accounts.Blizzard')
        */}
      </div>
      <div className="account-details">{account.displayName}</div>
    </div>
  );
}

const Account = React.forwardRef(AccountComp);

interface StoreProps {
  currentAccount?: DestinyAccount;
  accounts: readonly DestinyAccount[];
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    currentAccount: currentAccountSelector(state),
    accounts: accountsSelector(state)
  };
}

const mapDispatchToProps = {
  loadAccountsFromIndexedDB: loadAccountsFromIndexedDB as any
};
type DispatchProps = typeof mapDispatchToProps;

type Props = StoreProps & DispatchProps;

interface State {
  open: boolean;
}

class AccountSelect extends React.Component<Props, State> {
  state: State = {
    open: false
  };
  private dropdownToggler = React.createRef<HTMLDivElement>();
  // tslint:disable-next-line:ban-types
  private unregisterTransitionHooks: Function[] = [];

  componentDidMount() {
    this.props.loadAccountsFromIndexedDB();
    getPlatforms();

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
    const { currentAccount, accounts } = this.props;
    const { open } = this.state;

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
            <div className="log-out" onClick={this.logOut} role="menuitem">
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

export default connect<StoreProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(AccountSelect);
