import { t } from 'app/i18next-t';
import React from 'react';
import ClickOutside from '../dim-ui/ClickOutside';
import { removeToken } from '../bungie-api/oauth-tokens';
import './AccountSelect.scss';
import { compareAccounts, DestinyAccount, PLATFORM_ICONS } from './destiny-account';
import { getPlatforms } from './platforms';
import clsx from 'clsx';
import { UISref } from '@uirouter/react';
import { router } from '../router';
import { AppIcon, signOutIcon, collapseIcon } from '../shell/icons';
import { loadAccountsFromIndexedDB, currentAccountSelector, accountsSelector } from './reducer';
import { connect } from 'react-redux';
import { RootState } from 'app/store/reducers';
import _ from 'lodash';

function AccountComp(
  {
    account,
    selected,
    className,
    ...other
  }: {
    account: DestinyAccount;
    selected?: boolean;
    className?: string;
  } & React.HTMLAttributes<HTMLDivElement>,
  ref?: React.Ref<HTMLDivElement>
) {
  return (
    <div
      ref={ref}
      className={clsx('account', className, { 'selected-account': selected })}
      {...other}
      role="menuitem"
    >
      <div className="account-name">{account.displayName}</div>
      <div className="account-details">
        <b>{account.destinyVersion === 1 ? 'D1' : 'D2'}</b>
        {account.platforms.map((platformType, index) => (
          <AppIcon
            key={platformType}
            className={index === 0 ? 'first' : ''}
            icon={PLATFORM_ICONS[platformType]}
          />
        ))}
      </div>
      {selected && <AppIcon className="collapse" icon={collapseIcon} />}
    </div>
  );
}

export const Account = React.forwardRef(AccountComp);

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

    const otherAccounts = _.sortBy(
      accounts.filter((p) => !compareAccounts(p, currentAccount)),
      (a) => a.lastPlayed
    ).reverse();

    return (
      <div className="account-select">
        <Account
          selected={true}
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
                {/*
                  t('Accounts.PlayStation')
                  t('Accounts.Xbox')
                  t('Accounts.Blizzard')
                  t('Accounts.Steam')
                  t('Accounts.Stadia')
                */}
                <Account
                  account={account}
                  onClick={this.closeDropdown}
                  title={t(`Accounts.${account.platformLabel}`)}
                />
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
    this.setState(({ open }) => ({ open: !open }));
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
