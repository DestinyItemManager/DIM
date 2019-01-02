import classNames from 'classnames';
import { t } from 'i18next';
import * as React from 'react';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { getActiveAccountStream } from '../accounts/platform.service';
import AccountSelect from '../accounts/account-select';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import Link from './Link';
import { router } from '../../router';
import './header.scss';

import logo from 'app/images/logo-type-right-light.svg';
import ClickOutside from '../dim-ui/ClickOutside';
import Refresh from './refresh';
import RatingMode from './rating-mode/RatingMode';
import { settings } from '../settings/settings';
import WhatsNewLink from '../whats-new/WhatsNewLink';
import MenuBadge from './MenuBadge';
import { UISref } from '@uirouter/react';
import { AppIcon, menuIcon, searchIcon, settingsIcon } from './icons';
import SearchFilter from '../search/SearchFilter';
import { Subscriptions } from '../rx-utils';
import { installPrompt$ } from '../../app-install';
import ExternalLink from '../dim-ui/ExternalLink';

const destiny1Links = [
  {
    state: 'destiny1.inventory',
    text: 'Header.Inventory'
  },
  {
    state: 'destiny1.loadout-builder',
    text: 'LB.LB'
  },
  {
    state: 'destiny1.vendors',
    text: 'Vendors.Vendors'
  },
  {
    state: 'destiny1.record-books',
    text: 'RecordBooks.RecordBooks'
  },
  {
    state: 'destiny1.activities',
    text: 'Activities.Activities'
  }
];

const destiny2Links = [
  {
    state: 'destiny2.inventory',
    text: 'Header.Inventory'
  },
  {
    state: 'destiny2.progress',
    text: 'Progress.Progress'
  },
  {
    state: 'destiny2.vendors',
    text: 'Vendors.Vendors'
  },
  {
    state: 'destiny2.collections',
    text: 'Vendors.Collections'
  }
];

// conditionally add in the d2 loadout builder
if ($featureFlags.d2LoadoutBuilder) {
  destiny2Links.splice(1, 0, {
    state: 'destiny2.loadoutbuilder',
    text: 'LoadoutBuilder.Title'
  });
}

const shopLink = 'https://shop.destinyitemmanager.com/';
const bugReport = 'https://github.com/DestinyItemManager/DIM/issues';

interface State {
  account?: DestinyAccount;
  dropdownOpen: boolean;
  showSearch: boolean;
  installPromptEvent?: any;
}

export default class Header extends React.PureComponent<{}, State> {
  private subscriptions = new Subscriptions();
  // tslint:disable-next-line:ban-types
  private unregisterTransitionHooks: Function[] = [];
  private dropdownToggler = React.createRef<HTMLElement>();
  private searchFilter = React.createRef<any>();

  constructor(props) {
    super(props);

    this.state = {
      dropdownOpen: false,
      showSearch: false
    };
  }

  componentDidMount() {
    this.subscriptions.add(
      getActiveAccountStream().subscribe((account) => {
        this.setState({ account: account || undefined });
      }),
      installPrompt$.subscribe((installPromptEvent) => this.setState({ installPromptEvent }))
    );

    this.unregisterTransitionHooks = [
      router.transitionService.onBefore({}, () => {
        this.setState({ dropdownOpen: false });
      })
    ];
  }

  componentWillUnmount() {
    this.unregisterTransitionHooks.forEach((f) => f());
    this.subscriptions.unsubscribe();
  }

  render() {
    const { account, showSearch, dropdownOpen, installPromptEvent } = this.state;

    // TODO: new fontawesome
    const bugReportLink = $DIM_FLAVOR !== 'release';

    // Generic links about DIM
    const dimLinks = (
      <>
        <Link state="about" text="Header.About" />
        <Link state="support" text="Header.SupportDIM" />
        <ExternalLink className="link" href={shopLink}>
          {t('Header.Shop')}
        </ExternalLink>
        <WhatsNewLink />
        {bugReportLink && (
          <ExternalLink className="link" href={bugReport}>
            {t('Header.ReportBug')}
          </ExternalLink>
        )}
      </>
    );

    const links = account ? (account.destinyVersion === 1 ? destiny1Links : destiny2Links) : [];

    // Links about the current Destiny version
    const destinyLinks = (
      <>
        {links.map((link) => (
          <Link key={link.state} account={account} state={link.state} text={link.text} />
        ))}
      </>
    );

    const reverseDestinyLinks = (
      <>
        {links
          .slice()
          .reverse()
          .map((link) => (
            <Link key={link.state} account={account} state={link.state} text={link.text} />
          ))}
      </>
    );
    const reverseDimLinks = (
      <>
        {links.length > 0 && <span className="header-separator" />}
        {bugReportLink && (
          <ExternalLink className="link" href={bugReport}>
            {t('Header.ReportBug')}
          </ExternalLink>
        )}
        <WhatsNewLink />
        <ExternalLink className="link" href={shopLink}>
          {t('Header.Shop')}
        </ExternalLink>
        <Link state="support" text="Header.SupportDIM" />
        <Link state="about" text="Header.About" />
      </>
    );

    return (
      <div id="header" className={showSearch ? 'search-expanded' : ''}>
        <span className="menu link" ref={this.dropdownToggler} onClick={this.toggleDropdown}>
          <AppIcon icon={menuIcon} />
          <MenuBadge />
        </span>

        <TransitionGroup>
          {dropdownOpen && (
            <CSSTransition classNames="dropdown" timeout={{ enter: 500, exit: 500 }}>
              <ClickOutside key="dropdown" className="dropdown" onClickOutside={this.hideDropdown}>
                {destinyLinks}
                {links.length > 0 && <hr />}
                <Link state="settings" text="Settings.Settings" />
                {installPromptEvent && (
                  <a className="link" onClick={this.installDim}>
                    {t('Header.InstallDIM')}
                  </a>
                )}
                <hr />
                {dimLinks}
              </ClickOutside>
            </CSSTransition>
          )}
        </TransitionGroup>

        <UISref to="default-account">
          <img
            className={classNames('logo', 'link', $DIM_FLAVOR)}
            title={`v${$DIM_VERSION} (${$DIM_FLAVOR})`}
            src={logo}
            alt="DIM"
          />
        </UISref>

        <div className="header-links">
          {reverseDestinyLinks}
          {reverseDimLinks}
        </div>

        <span className="header-right">
          <Refresh />
          {account &&
            account.destinyVersion === 2 &&
            (settings.showReviews || $featureFlags.curatedRolls) && <RatingMode />}
          <UISref to="settings">
            <a className="link" title={t('Settings.Settings')}>
              <AppIcon icon={settingsIcon} />
            </a>
          </UISref>
          {account && (
            <span className={classNames('link', 'search-link', { show: showSearch })}>
              <SearchFilter onClear={this.hideSearch} ref={this.searchFilter} mobile={showSearch} />
            </span>
          )}
          <span className="link search-button" onClick={this.toggleSearch}>
            <AppIcon icon={searchIcon} />
          </span>
          {account && <AccountSelect currentAccount={account} />}
        </span>
      </div>
    );
  }

  componentDidUpdate(_prevProps, prevState: State) {
    if (!prevState.showSearch && this.state.showSearch && this.searchFilter.current) {
      this.searchFilter.current.getWrappedInstance().focusFilterInput();
    }
  }

  private toggleDropdown = () => {
    this.setState({ dropdownOpen: !this.state.dropdownOpen });
  };

  private hideDropdown = (event) => {
    if (!this.dropdownToggler.current || !this.dropdownToggler.current.contains(event.target)) {
      this.setState({ dropdownOpen: false });
    }
  };

  private toggleSearch = () => {
    this.setState({ showSearch: !this.state.showSearch });
  };

  private hideSearch = () => {
    if (this.state.showSearch) {
      this.setState({ showSearch: false });
    }
  };

  private installDim = () => {
    const deferredPrompt = this.state.installPromptEvent!;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User installed DIM to desktop/home screen');
      } else {
        console.log('User dismissed the install prompt');
      }
      installPrompt$.next(undefined);
    });
  };
}
