import MenuAccounts from 'app/accounts/MenuAccounts';
import { currentAccountSelector } from 'app/accounts/selectors';
import Sheet from 'app/dim-ui/Sheet';
import { Hotkey } from 'app/hotkeys/hotkeys';
import { useHotkeys } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import { accountRoute } from 'app/routes';
import { SearchFilterRef } from 'app/search/SearchBar';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { useSubscription } from 'app/utils/hooks';
import { infoLog } from 'app/utils/log';
import { getAllVendorDrops, isDroppingHigh } from 'app/vendorEngramsXyzApi/vendorEngramsXyzService';
import clsx from 'clsx';
import logo from 'images/logo-type-right-light.svg';
import _ from 'lodash';
import Mousetrap from 'mousetrap';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { useLocation } from 'react-router';
import { Link, NavLink } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import vendorEngramSvg from '../../images/engram.svg';
import { DestinyAccount } from '../accounts/destiny-account';
import ClickOutside from '../dim-ui/ClickOutside';
import ExternalLink from '../dim-ui/ExternalLink';
import { default as SearchFilter } from '../search/SearchFilter';
import WhatsNewLink from '../whats-new/WhatsNewLink';
import { setSearchQuery } from './actions';
import { installPrompt$ } from './app-install';
import styles from './Header.m.scss';
import './header.scss';
import { AppIcon, menuIcon, searchIcon, settingsIcon } from './icons';
import MenuBadge from './MenuBadge';
import Refresh from './refresh';

const bugReport = 'https://github.com/DestinyItemManager/DIM/issues';

interface StoreProps {
  account?: DestinyAccount;
  vendorEngramDropActive: boolean;
  isPhonePortrait: boolean;
}

// TODO: finally time to hack apart the header styles!

type Props = StoreProps & ThunkDispatchProp;

function mapStateToProps(state: RootState): StoreProps {
  return {
    account: currentAccountSelector(state),
    vendorEngramDropActive: state.vendorDrops.vendorDrops.some(isDroppingHigh),
    isPhonePortrait: state.shell.isPhonePortrait,
  };
}

function Header({ account, vendorEngramDropActive, isPhonePortrait, dispatch }: Props) {
  // Hamburger menu
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownToggler = useRef<HTMLAnchorElement>(null);
  const toggleDropdown = useCallback((e) => {
    e.preventDefault();
    setDropdownOpen((dropdownOpen) => !dropdownOpen);
  }, []);

  const hideDropdown = (event) => {
    if (!dropdownToggler.current || !dropdownToggler.current.contains(event.target)) {
      setDropdownOpen(false);
    }
  };

  // Mobile search bar
  const [showSearch, setShowSearch] = useState(false);
  const toggleSearch = () => setShowSearch((showSearch) => !showSearch);
  const hideSearch = useCallback(() => {
    if (showSearch) {
      setShowSearch(false);
    }
  }, [showSearch]);

  // Install DIM as a PWA
  const [promptIosPwa, setPromptIosPwa] = useState(false);
  const [installPromptEvent, setInstallPromptevent] = useState<any>(undefined);
  useSubscription(() => installPrompt$.subscribe(setInstallPromptevent));

  const showInstallPrompt = () => {
    setPromptIosPwa(true);
    setDropdownOpen(false);
  };

  const installDim = () => {
    if (installPromptEvent) {
      installPromptEvent.prompt();
      installPromptEvent.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          infoLog('install', 'User installed DIM to desktop/home screen');
        } else {
          infoLog('install', 'User dismissed the install prompt');
        }
        installPrompt$.next(undefined);
      });
    }
  };

  const destinyVersion = account?.destinyVersion;

  // Poll for vendor engrams
  const engramRefreshTimer = useRef<number>();
  useEffect(() => {
    if ($featureFlags.vendorEngrams && destinyVersion === 2) {
      setInterval(() => dispatch(getAllVendorDrops()), 5 * 60 * 1000);
      return () => {
        if (engramRefreshTimer.current) {
          clearInterval(engramRefreshTimer.current);
          engramRefreshTimer.current = 0;
        }
      };
    } else {
      return;
    }
  }, [destinyVersion, dispatch]);

  // Search filter
  const searchFilter = useRef<SearchFilterRef>(null);

  // Clear filter and close dropdown on path change
  const { pathname } = useLocation();
  useEffect(() => {
    setDropdownOpen(false);
    dispatch(setSearchQuery(''));
  }, [dispatch, pathname]);

  // Focus search when shown
  useEffect(() => {
    if (searchFilter.current && showSearch) {
      searchFilter.current.focusFilterInput();
    }
    document.body.classList.toggle('search-open', showSearch);
  }, [showSearch]);

  const nodeRef = useRef<HTMLDivElement>(null);

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
    badge?: React.ReactNode;
  }[] = [];
  if (account) {
    const path = accountRoute(account);
    links = _.compact([
      {
        to: `${path}/inventory`,
        text: t('Header.Inventory'),
      },
      account.destinyVersion === 2 && {
        to: `${path}/progress`,
        text: t('Progress.Progress'),
      },
      {
        to: `${path}/vendors`,
        text: t('Vendors.Vendors'),
        badge: vendorEngramDropActive && (
          <img src={vendorEngramSvg} className={styles.vendorEngramBadge} />
        ),
      },
      account.destinyVersion === 2 && {
        to: `${path}/records`,
        text: t('Records.Title'),
      },
      {
        to: `${path}/optimizer`,
        text: t('LB.LB'),
      },
      {
        to: `${path}/organizer`,
        text: t('Organizer.Organizer'),
      },
      account.destinyVersion === 1 && {
        to: `${path}/record-books`,
        text: t('RecordBooks.RecordBooks'),
      },
      account.destinyVersion === 1 && {
        to: `${path}/activities`,
        text: t('Activities.Activities'),
      },
    ]);
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

  const hotkeys: Hotkey[] = [
    {
      combo: 'm',
      description: t('Hotkey.Menu'),
      callback: toggleDropdown,
    },
    {
      combo: 'f',
      description: t('Hotkey.StartSearch'),
      callback: (event) => {
        if (searchFilter.current) {
          searchFilter.current.focusFilterInput();
          if (isPhonePortrait) {
            setShowSearch(true);
          }
        }
        event.preventDefault();
        event.stopPropagation();
      },
    },
    {
      combo: 'shift+f',
      description: t('Hotkey.StartSearchClear'),
      callback: (event) => {
        if (searchFilter.current) {
          searchFilter.current.clearFilter();
          searchFilter.current.focusFilterInput();
          if (isPhonePortrait) {
            setShowSearch(true);
          }
        }
        event.preventDefault();
        event.stopPropagation();
      },
    },
  ];
  useHotkeys(hotkeys);

  const showKeyboardHelp = (e) => {
    e.preventDefault();
    e.stopPropagation();
    Mousetrap.trigger('?');
    setDropdownOpen(false);
  };

  const iosPwaAvailable =
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !window.MSStream &&
    (window.navigator as any).standalone !== true;

  return (
    <header id="header" className={showSearch ? 'search-expanded' : ''}>
      <a
        className="menu link menuItem"
        ref={dropdownToggler}
        onClick={toggleDropdown}
        role="button"
        aria-haspopup="menu"
        aria-label={t('Header.Menu')}
        aria-expanded={dropdownOpen}
      >
        <AppIcon icon={menuIcon} />
        <MenuBadge />
      </a>
      <TransitionGroup component={null}>
        {dropdownOpen && (
          <CSSTransition
            nodeRef={nodeRef}
            classNames="dropdown"
            timeout={{ enter: 500, exit: 500 }}
          >
            <ClickOutside
              ref={nodeRef}
              key="dropdown"
              className="dropdown"
              onClickOutside={hideDropdown}
              role="menu"
            >
              {destinyLinks}
              <hr />
              <NavLink className="link menuItem" to="/settings">
                {t('Settings.Settings')}
              </NavLink>
              {!isPhonePortrait && (
                <a className="link menuItem" onClick={showKeyboardHelp}>
                  {t('Header.KeyboardShortcuts')}
                </a>
              )}
              <ExternalLink
                className="link menuItem"
                href="https://destinyitemmanager.fandom.com/wiki/Category:User_Guide"
              >
                {t('General.UserGuideLink')}
              </ExternalLink>
              {installPromptEvent ? (
                <a className="link menuItem" onClick={installDim}>
                  {t('Header.InstallDIM')}
                </a>
              ) : (
                iosPwaAvailable && (
                  <a className="link menuItem" onClick={showInstallPrompt}>
                    {t('Header.InstallDIM')}
                  </a>
                )
              )}
              {dimLinks}
              <MenuAccounts closeDropdown={hideDropdown} />
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
        {account && (!isPhonePortrait || showSearch) && (
          <span className={clsx('search-link menuItem')}>
            <SearchFilter onClear={hideSearch} ref={searchFilter} />
          </span>
        )}
        <Refresh />
        {!isPhonePortrait && (
          <Link className="link menuItem" to="/settings" title={t('Settings.Settings')}>
            <AppIcon icon={settingsIcon} />
          </Link>
        )}
        <span className="link search-button menuItem" onClick={toggleSearch}>
          <AppIcon icon={searchIcon} />
        </span>
      </div>
      {promptIosPwa &&
        ReactDOM.createPortal(
          <Sheet header={<h1>{t('Header.InstallDIM')}</h1>} onClose={() => setPromptIosPwa(false)}>
            <p className="pwa-prompt">{t('Header.IosPwaPrompt')}</p>
          </Sheet>,
          document.body
        )}
    </header>
  );
}

export default connect(mapStateToProps)(Header);
