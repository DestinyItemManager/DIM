import classNames from 'classnames';
import { t } from 'app/i18next-t';
import React from 'react';
import { DestinyAccount } from '../accounts/destiny-account.service';
import AccountSelect from '../accounts/AccountSelect';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import Link from './Link';
import { router } from '../../router';
import './header.scss';

import logo from 'images/logo-type-right-light.svg';
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
import SearchFilterInput from '../search/SearchFilterInput';
import { connect } from 'react-redux';
import { RootState } from 'app/store/reducers';
import { currentAccountSelector } from 'app/accounts/reducer';
import GlobalHotkeys from '../hotkeys/GlobalHotkeys';

const destiny1Links = [
  {
    state: 'destiny1.inventory',
    text: 'Header.Inventory' // t('Header.Inventory')
  },
  {
    state: 'destiny1.loadout-builder',
    text: 'LB.LB' // t('LB.LB')
  },
  {
    state: 'destiny1.vendors',
    text: 'Vendors.Vendors' // t('Vendors.Vendors')
  },
  {
    state: 'destiny1.record-books',
    text: 'RecordBooks.RecordBooks' // t('RecordBooks.RecordBooks')
  },
  {
    state: 'destiny1.activities',
    text: 'Activities.Activities' // t('Activities.Activities')
  }
];

const destiny2Links = [
  {
    state: 'destiny2.inventory',
    text: 'Header.Inventory' // t('Header.Inventory')
  },
  {
    state: 'destiny2.progress',
    text: 'Progress.Progress' // t('Progress.Progress')
  },
  {
    state: 'destiny2.vendors',
    text: 'Vendors.Vendors' // t('Vendors.Vendors')
  },
  {
    state: 'destiny2.collections',
    text: 'Vendors.Collections' // t('Vendors.Collections')
  }
];

// conditionally add in the d2 loadout builder
if ($featureFlags.d2LoadoutBuilder) {
  destiny2Links.splice(1, 0, {
    state: 'destiny2.loadoutbuilder',
    text: 'LB.LB' // t('LB.LB')
  });
}

const shopLink = 'https://www.designbyhumans.com/shop/DestinyItemManager/';
const bugReport = 'https://github.com/DestinyItemManager/DIM/issues';

interface StoreProps {
  account?: DestinyAccount;
}

type Props = StoreProps;

function mapStateToProps(state: RootState): StoreProps {
  return {
    account: currentAccountSelector(state)
  };
}

interface State {
  dropdownOpen: boolean;
  showSearch: boolean;
  installPromptEvent?: any;
}

class Header extends React.PureComponent<Props, State> {
  private subscriptions = new Subscriptions();
  // tslint:disable-next-line:ban-types
  private unregisterTransitionHooks: Function[] = [];
  private dropdownToggler = React.createRef<HTMLAnchorElement>();
  private searchFilter = React.createRef<SearchFilterInput>();

  constructor(props) {
    super(props);

    this.state = {
      dropdownOpen: false,
      showSearch: false
    };
  }

  componentDidMount() {
    this.subscriptions.add(
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
    const { account } = this.props;
    const { showSearch, dropdownOpen, installPromptEvent } = this.state;

    // TODO: new fontawesome
    const bugReportLink = $DIM_FLAVOR !== 'release';

    // Generic links about DIM
    const dimLinks = (
      <>
        <Link state="about" text={t('Header.About')} />
        <Link state="support" text={t('Header.SupportDIM')} />
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
          <Link key={link.state} account={account} state={link.state} text={t(link.text)} />
        ))}
      </>
    );

    const reverseDestinyLinks = (
      <>
        {links
          .slice()
          .reverse()
          .map((link) => (
            <Link key={link.state} account={account} state={link.state} text={t(link.text)} />
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
        <Link state="support" text={t('Header.SupportDIM')} />
        <Link state="about" text={t('Header.About')} />
      </>
    );

    return (
      <nav id="header" className={showSearch ? 'search-expanded' : ''}>
        <GlobalHotkeys
          hotkeys={[
            {
              combo: 'm',
              description: t('Hotkey.Menu'),
              callback: this.toggleDropdown
            }
          ]}
        >
          <a
            className="menu link"
            ref={this.dropdownToggler}
            onClick={this.toggleDropdown}
            role="button"
            aria-haspopup="menu"
            aria-label={t('Header.Menu')}
            aria-expanded={dropdownOpen}
          >
            <AppIcon icon={menuIcon} />
            <MenuBadge />
          </a>
        </GlobalHotkeys>

        <TransitionGroup>
          {dropdownOpen && (
            <CSSTransition classNames="dropdown" timeout={{ enter: 500, exit: 500 }}>
              <ClickOutside
                key="dropdown"
                className="dropdown"
                onClickOutside={this.hideDropdown}
                role="menu"
              >
                {destinyLinks}
                <Link state="settings" text={t('Settings.Settings')} />
                {installPromptEvent && (
                  <a className="link" onClick={this.installDim}>
                    {t('Header.InstallDIM')}
                  </a>
                )}
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
            aria-label="dim"
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
            <span className={classNames('search-link', { show: showSearch })}>
              <SearchFilter onClear={this.hideSearch} ref={this.searchFilter} mobile={showSearch} />
            </span>
          )}
          <span className="link search-button" onClick={this.toggleSearch}>
            <AppIcon icon={searchIcon} />
          </span>
          <AccountSelect />
        </span>
      </nav>
    );
  }

  componentDidUpdate(_prevProps, prevState: State) {
    if (!prevState.showSearch && this.state.showSearch && this.searchFilter.current) {
      this.searchFilter.current.focusFilterInput();
    }
  }

  private toggleDropdown = (e) => {
    e.preventDefault();
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
    const deferredPrompt = this.state.installPromptEvent;
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

export default connect(mapStateToProps)(Header);
