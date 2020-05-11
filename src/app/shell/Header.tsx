import clsx from 'clsx';
import { t } from 'app/i18next-t';
import React from 'react';
import { DestinyAccount } from '../accounts/destiny-account';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import './header.scss';
import logo from 'images/logo-type-right-light.svg';
import ClickOutside from '../dim-ui/ClickOutside';
import Refresh from './refresh';
import WhatsNewLink from '../whats-new/WhatsNewLink';
import MenuBadge from './MenuBadge';
import { AppIcon, menuIcon, searchIcon, settingsIcon } from './icons';
import { default as SearchFilter, SearchFilter as SearchFilterClass } from '../search/SearchFilter';
import { Subscriptions } from '../utils/rx-utils';
import { installPrompt$ } from './app-install';
import ExternalLink from '../dim-ui/ExternalLink';
import { connect } from 'react-redux';
import { RootState, ThunkDispatchProp } from 'app/store/reducers';
import { currentAccountSelector } from 'app/accounts/reducer';
import GlobalHotkeys from '../hotkeys/GlobalHotkeys';
import MenuAccounts from 'app/accounts/MenuAccounts';
import ReactDOM from 'react-dom';
import Sheet from 'app/dim-ui/Sheet';
import { Link, NavLink } from 'react-router-dom';
import _ from 'lodash';
import { isDroppingHigh, getAllVendorDrops } from 'app/vendorEngramsXyzApi/vendorEngramsXyzService';
import vendorEngramSvg from '../../images/engram.svg';
import { accountRoute } from 'app/routes';
import { withRouter, RouteComponentProps } from 'react-router';
import styles from './Header.m.scss';

const bugReport = 'https://github.com/DestinyItemManager/DIM/issues';

interface StoreProps {
  account?: DestinyAccount;
  vendorEngramDropActive: boolean;
}

// TODO: finally time to hack apart the header styles!

type Props = StoreProps & ThunkDispatchProp & RouteComponentProps;

function mapStateToProps(state: RootState): StoreProps {
  return {
    account: currentAccountSelector(state),
    vendorEngramDropActive: state.vendorDrops.vendorDrops.some(isDroppingHigh)
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
  private unregisterTransitionHooks: Function[] = [];
  private dropdownToggler = React.createRef<HTMLAnchorElement>();
  private searchFilter = React.createRef<SearchFilterClass>();
  private engramRefreshTimer: number;

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

    this.updateVendorEngrams(this.props.account || undefined);
  }

  componentWillUnmount() {
    this.unregisterTransitionHooks.forEach((f) => f());
    this.subscriptions.unsubscribe();
    this.stopPollingVendorEngrams();
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (this.props.location.pathname !== prevProps.location.pathname) {
      this.setState({ dropdownOpen: false });
      if (this.searchFilter.current) {
        this.searchFilter.current.clearFilter();
      }
    }

    if (!prevState.showSearch && this.state.showSearch && this.searchFilter.current) {
      this.searchFilter.current.focusFilterInput();
    }

    if (prevProps.account?.destinyVersion !== this.props.account?.destinyVersion) {
      this.updateVendorEngrams(this.props.account || undefined);
    }
  }

  render() {
    const { account, vendorEngramDropActive, history } = this.props;
    const { showSearch, dropdownOpen, installPromptEvent, promptIosPwa } = this.state;

    const bugReportLink = $DIM_FLAVOR !== 'release';

    const isStandalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;

    // Generic links about DIM
    const dimLinks = (
      <>
        <NavLink to="/about" className="link menuItem">
          {t('Header.About')}
        </NavLink>
        <WhatsNewLink />
        {bugReportLink && (
          <ExternalLink className="link menuItem" href={bugReport}>
            {t('Header.ReportBug')}
          </ExternalLink>
        )}
        {isStandalone && (
          <a className="link menuItem" onClick={() => window.location.reload()}>
            {t('Header.ReloadApp')}
          </a>
        )}
      </>
    );

    let links: {
      to: string;
      text: string;
      hotkey?: string;
      badge?: React.ReactNode;
    }[] = [];
    if (account) {
      const path = accountRoute(account);

      links =
        account.destinyVersion === 2
          ? _.compact([
              {
                to: `${path}/inventory`,
                text: t('Header.Inventory'),
                hotkey: 'i'
              },
              {
                to: `${path}/progress`,
                text: t('Progress.Progress'),
                hotkey: 'p'
              },
              {
                to: `${path}/vendors`,
                text: t('Vendors.Vendors'),
                hotkey: 'v',
                badge: vendorEngramDropActive && (
                  <img src={vendorEngramSvg} className={styles.vendorEngramBadge} />
                )
              },
              {
                to: `${path}/collections`,
                text: t('Vendors.Collections'),
                hotkey: 'c'
              },
              {
                to: `${path}/optimizer`,
                text: t('LB.LB'),
                hotkey: 'b'
              },
              $featureFlags.organizer && {
                to: `${path}/organizer`,
                text: t('Organizer.Organizer'),
                hotkey: 'o'
              }
            ])
          : [
              {
                to: `${path}/inventory`,
                text: t('Header.Inventory'),
                hotkey: 'i'
              },
              {
                to: `${path}/optimizer`,
                text: t('LB.LB'),
                hotkey: 'o'
              },
              {
                to: `${path}/vendors`,
                text: t('Vendors.Vendors'),
                hotkey: 'v'
              },
              {
                to: `${path}/record-books`,
                text: t('RecordBooks.RecordBooks')
              },
              {
                to: `${path}/activities`,
                text: t('Activities.Activities')
              }
            ];
    }

    const linkNodes = links.map((link) => (
      <NavLink className="link menuItem" key={link.to} to={link.to}>
        {link.badge}
        {link.text}
      </NavLink>
    ));

    // Links about the current Destiny version
    const destinyLinks = <>{linkNodes}</>;
    const reverseDestinyLinks = <>{linkNodes.slice().reverse()}</>;

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
              description: link.text,
              callback: () => history.push(link.to)
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
            className="menu link menuItem"
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
        <TransitionGroup component={null}>
          {dropdownOpen && (
            <CSSTransition classNames="dropdown" timeout={{ enter: 500, exit: 500 }}>
              <ClickOutside
                key="dropdown"
                className="dropdown"
                onClickOutside={this.hideDropdown}
                role="menu"
              >
                {destinyLinks}
                <hr />
                <NavLink className="link menuItem" to="/settings">
                  {t('Settings.Settings')}
                </NavLink>
                {installPromptEvent ? (
                  <a className="link" onClick={this.installDim}>
                    {t('Header.InstallDIM')}
                  </a>
                ) : (
                  iosPwaAvailable && (
                    <a
                      className="link menuItem"
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
        <Link to="/" className="link menuItem logoLink">
          <img
            className={clsx('logo', $DIM_FLAVOR)}
            title={`v${$DIM_VERSION} (${$DIM_FLAVOR})`}
            src={logo}
            alt="DIM"
            aria-label="dim"
          />
        </Link>
        <div className="header-links">{reverseDestinyLinks}</div>
        <div className="header-right">
          {account && (
            <span className={clsx('search-link menuItem', { show: showSearch })}>
              <SearchFilter
                onClear={this.hideSearch}
                ref={this.searchFilter as any}
                mobile={showSearch}
              />
            </span>
          )}
          <Refresh />
          <Link className="link menuItem" to="/settings" title={t('Settings.Settings')}>
            <AppIcon icon={settingsIcon} />
          </Link>
          <span className="link search-button menuItem" onClick={this.toggleSearch}>
            <AppIcon icon={searchIcon} />
          </span>
        </div>
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

  private updateVendorEngrams = (account = this.props.account) => {
    if ($featureFlags.vendorEngrams) {
      if (!account || account.destinyVersion !== 2) {
        this.stopPollingVendorEngrams();
        return;
      }

      this.props.dispatch(getAllVendorDrops());
    }
  };

  private stopPollingVendorEngrams = () => {
    if (this.engramRefreshTimer) {
      clearInterval(this.engramRefreshTimer);
      this.engramRefreshTimer = 0;
    }
  };

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

export default withRouter(connect(mapStateToProps)(Header));
