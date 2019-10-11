import clsx from 'clsx';
import { t } from 'app/i18next-t';
import React from 'react';
import { DestinyAccount } from '../accounts/destiny-account';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import Link from './Link';
import { router } from '../router';
import './header.scss';

import logo from 'images/logo-type-right-light.svg';
import ClickOutside from '../dim-ui/ClickOutside';
import Refresh from './refresh';
import WhatsNewLink from '../whats-new/WhatsNewLink';
import MenuBadge from './MenuBadge';
import { UISref } from '@uirouter/react';
import { AppIcon, menuIcon, searchIcon, settingsIcon } from './icons';
import SearchFilter from '../search/SearchFilter';
import { Subscriptions } from '../utils/rx-utils';
import { installPrompt$ } from './app-install';
import ExternalLink from '../dim-ui/ExternalLink';
import SearchFilterInput from '../search/SearchFilterInput';
import { connect } from 'react-redux';
import { RootState } from 'app/store/reducers';
import { currentAccountSelector } from 'app/accounts/reducer';
import GlobalHotkeys from '../hotkeys/GlobalHotkeys';
import MenuAccounts from 'app/accounts/MenuAccounts';
import ReactDOM from 'react-dom';
import Sheet from 'app/dim-ui/Sheet';
import _ from 'lodash';

const destiny1Links = [
  {
    state: 'destiny1.inventory',
    text: 'Header.Inventory', // t('Header.Inventory')
    hotkey: 'i'
  },
  {
    state: 'destiny1.loadout-builder',
    text: 'LB.LB', // t('LB.LB')
    hotkey: 'o'
  },
  {
    state: 'destiny1.vendors',
    text: 'Vendors.Vendors', // t('Vendors.Vendors')
    hotkey: 'v'
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
    text: 'Header.Inventory', // t('Header.Inventory')
    hotkey: 'i'
  },
  {
    state: 'destiny2.progress',
    text: 'Progress.Progress', // t('Progress.Progress')
    hotkey: 'p'
  },
  {
    state: 'destiny2.vendors',
    text: 'Vendors.Vendors', // t('Vendors.Vendors')
    hotkey: 'v'
  },
  {
    state: 'destiny2.collections',
    text: 'Vendors.Collections', // t('Vendors.Collections')
    hotkey: 'c'
  },
  {
    state: 'destiny2.loadoutbuilder',
    text: 'LB.LB', // t('LB.LB')
    hotkey: 'o'
  }
];

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
  promptIosPwa: boolean;
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
      showSearch: false,
      promptIosPwa: false
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
    const { showSearch, dropdownOpen, installPromptEvent, promptIosPwa } = this.state;

    // TODO: new fontawesome
    const bugReportLink = $DIM_FLAVOR !== 'release';

    const isStandalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;

    // Generic links about DIM
    const dimLinks = (
      <>
        <Link state="about" text={t('Header.About')} />
        <WhatsNewLink />
        {bugReportLink && (
          <ExternalLink className="link" href={bugReport}>
            {t('Header.ReportBug')}
          </ExternalLink>
        )}
        {isStandalone && (
          <a className="link" onClick={() => window.location.reload()}>
            {t('Header.ReloadApp')}
          </a>
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

    const hotkeys = [
      {
        combo: 'm',
        description: t('Hotkey.Menu'),
        callback: this.toggleDropdown
      },
      ..._.compact(
        links.map(
          (link) =>
            link.hotkey && {
              combo: link.hotkey,
              description: t(link.text),
              callback: () => router.stateService.go(link.state, account)
            }
        )
      )
    ];

    const iosPwaAvailable =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !window.MSStream &&
      (window.navigator as any).standalone !== true;

    return (
      <header id="header" className={showSearch ? 'search-expanded' : ''}>
        <GlobalHotkeys hotkeys={hotkeys}>
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
            <CSSTransition clsx="dropdown" timeout={{ enter: 500, exit: 500 }}>
              <ClickOutside
                key="dropdown"
                className="dropdown"
                onClickOutside={this.hideDropdown}
                role="menu"
              >
                {destinyLinks}
                <hr />
                <Link state="settings" text={t('Settings.Settings')} />
                {installPromptEvent ? (
                  <a className="link" onClick={this.installDim}>
                    {t('Header.InstallDIM')}
                  </a>
                ) : (
                  iosPwaAvailable && (
                    <a
                      className="link"
                      onClick={() => this.setState({ promptIosPwa: true, dropdownOpen: false })}
                    >
                      {t('Header.InstallDIM')}
                    </a>
                  )
                )}
                {dimLinks}
                <MenuAccounts closeDropdown={this.hideDropdown} />
              </ClickOutside>
            </CSSTransition>
          )}
        </TransitionGroup>
        <UISref to="default-account">
          <img
            className={clsx('logo', 'link', $DIM_FLAVOR)}
            title={`v${$DIM_VERSION} (${$DIM_FLAVOR})`}
            src={logo}
            alt="DIM"
            aria-label="dim"
          />
        </UISref>
        <div className="header-links">{reverseDestinyLinks}</div>
        <span className="header-right">
          {account && (
            <span className={clsx('search-link', { show: showSearch })}>
              <SearchFilter onClear={this.hideSearch} ref={this.searchFilter} mobile={showSearch} />
            </span>
          )}
          <Refresh />
          <UISref to="settings">
            <a className="link" title={t('Settings.Settings')}>
              <AppIcon icon={settingsIcon} />
            </a>
          </UISref>
          <span className="link search-button" onClick={this.toggleSearch}>
            <AppIcon icon={searchIcon} />
          </span>
        </span>
        {promptIosPwa &&
          ReactDOM.createPortal(
            <Sheet
              header={<h1>{t('Header.InstallDIM')}</h1>}
              onClose={() => this.setState({ promptIosPwa: false })}
            >
              <p className="pwa-prompt">{t('Header.IosPwaPrompt')}</p>
            </Sheet>,
            document.body
          )}
      </header>
    );
  }

  componentDidUpdate(_prevProps, prevState: State) {
    if (!prevState.showSearch && this.state.showSearch && this.searchFilter.current) {
      this.searchFilter.current.focusFilterInput();
    }
  }

  private toggleDropdown = (e) => {
    e.preventDefault();
    this.setState(({ dropdownOpen }) => ({ dropdownOpen: !dropdownOpen }));
  };

  private hideDropdown = (event) => {
    if (!this.dropdownToggler.current || !this.dropdownToggler.current.contains(event.target)) {
      this.setState({ dropdownOpen: false });
    }
  };

  private toggleSearch = () => {
    this.setState(({ showSearch }) => ({ showSearch: !showSearch }));
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
