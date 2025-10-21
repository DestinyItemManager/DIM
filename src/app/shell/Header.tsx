import MenuAccounts from 'app/accounts/MenuAccounts';
import { currentAccountSelector } from 'app/accounts/selectors';
import { PressTipRoot } from 'app/dim-ui/PressTip';
import Sheet from 'app/dim-ui/Sheet';
import { showCheatSheet$ } from 'app/hotkeys/HotkeysCheatSheet';
import { Hotkey } from 'app/hotkeys/hotkeys';
import { useHotkeys } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import { accountRoute } from 'app/routes';
import { SearchFilterRef } from 'app/search/SearchBar';
import DimApiWarningBanner from 'app/storage/DimApiWarningBanner';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import StreamDeckButton from 'app/stream-deck/StreamDeckButton/StreamDeckButton';
import { streamDeckEnabledSelector } from 'app/stream-deck/selectors';
import { isiOSBrowser } from 'app/utils/browsers';
import { compact } from 'app/utils/collections';
import { useSetCSSVarToHeight } from 'app/utils/hooks';
import { infoLog } from 'app/utils/log';
import clsx from 'clsx';
import logo from 'images/logo-type-right-light.svg';
import { AnimatePresence, Transition, Variants, motion } from 'motion/react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, NavLink, useLocation } from 'react-router';
import { useSubscription } from 'use-subscription';
import ClickOutside from '../dim-ui/ClickOutside';
import ExternalLink from '../dim-ui/ExternalLink';
import SearchFilter from '../search/SearchFilter';
import WhatsNewLink from '../whats-new/WhatsNewLink';
import AppInstallBanner from './AppInstallBanner';
import * as styles from './Header.m.scss';
import MenuBadge from './MenuBadge';
import PostmasterWarningBanner from './PostmasterWarningBanner';
import RefreshButton from './RefreshButton';
import { setSearchQuery } from './actions';
import { installPrompt$ } from './app-install';
import { AppIcon, faExternalLinkAlt, menuIcon, searchIcon, settingsIcon } from './icons';
import { userGuideLink } from './links';
import { useIsPhonePortrait } from './selectors';

const bugReport = 'https://github.com/DestinyItemManager/DIM/issues';

const logoStyles = {
  beta: styles.beta,
  dev: styles.dev,
  pr: styles.pr,
  release: undefined,
  test: undefined,
} as const;

const menuAnimateVariants: Variants = {
  open: { x: 0 },
  collapsed: { x: -250 },
};
const menuAnimateTransition: Transition<number> = { type: 'spring', duration: 0.3, bounce: 0 };

// TODO: finally time to hack apart the header styles!

export default function Header() {
  const dispatch = useThunkDispatch();
  const isPhonePortrait = useIsPhonePortrait();
  const account = useSelector(currentAccountSelector);

  // Hamburger menu
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownToggler = useRef<HTMLButtonElement>(null);
  const toggleDropdown = useCallback((e: React.MouseEvent | KeyboardEvent) => {
    e.preventDefault();
    setDropdownOpen((dropdownOpen) => !dropdownOpen);
  }, []);

  const hideDropdown = useCallback(() => {
    setDropdownOpen(false);
  }, []);

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
  const installPromptEvent = useSubscription(installPrompt$);

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
    } else {
      showInstallPrompt();
    }
  };

  // Is this running as an installed app?
  const isStandalone =
    window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

  const iosPwaAvailable = isiOSBrowser() && !isStandalone;

  const installable = installPromptEvent || iosPwaAvailable;

  const offerRelaunch =
    // as an alternative to installing,
    !isStandalone &&
    !installable &&
    // offer desktop users
    !isPhonePortrait;
  // the choice to relaunch in a no-tabs, less-UI window
  const reLaunchDim = () => {
    window.open(window.location.href, '_blank', 'resizable,scrollbars,status');
  };

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
  }, [showSearch]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const bugReportLink = $DIM_FLAVOR !== 'release';

  const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
    clsx(styles.menuItem, { [styles.active]: isActive });

  // Generic links about DIM
  const dimLinks = (
    <>
      <NavLink to="/about" className={navLinkClassName}>
        {t('Header.About')}
      </NavLink>
      <WhatsNewLink className={navLinkClassName} />
      {bugReportLink && (
        <ExternalLink className={styles.menuItem} href={bugReport}>
          {t('Header.ReportBug')}
        </ExternalLink>
      )}
      {isStandalone && (
        <a className={styles.menuItem} onClick={() => window.location.reload()}>
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
    links = compact([
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
      },
      account.destinyVersion === 2 && {
        to: `${path}/records`,
        text: t('Records.Title'),
      },
      account.destinyVersion === 2
        ? { to: `${path}/loadouts`, text: t('Loadouts.Loadouts') }
        : {
            to: `${path}/optimizer`,
            text: t('LB.LB'),
          },
      {
        to: `${path}/organizer`,
        text: t('Organizer.Organizer'),
      },
      account.destinyVersion === 2 &&
        isPhonePortrait && { to: `${path}/item-feed`, text: t('ItemFeed.Description') },
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
    <NavLink className={navLinkClassName} key={link.to} to={link.to}>
      {link.badge}
      {link.text}
    </NavLink>
  ));

  // Links about the current Destiny version
  const destinyLinks = linkNodes;

  const hotkeys = useMemo(() => {
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
    return hotkeys;
  }, [isPhonePortrait, toggleDropdown]);
  useHotkeys(hotkeys);

  const showKeyboardHelp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    showCheatSheet$.next(true);
    setDropdownOpen(false);
  };

  // Calculate the true height of the header, for use in other things
  const headerRef = useRef<HTMLDivElement>(null);
  useSetCSSVarToHeight(headerRef, '--header-height');

  const headerLinksRef = useRef<HTMLDivElement>(null);

  const streamDeckEnabled = $featureFlags.elgatoStreamDeck
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useSelector(streamDeckEnabledSelector)
    : false;

  return (
    <PressTipRoot value={headerRef}>
      <header className={styles.container} ref={headerRef}>
        <div className={styles.header}>
          <button
            type="button"
            className={clsx(styles.menuItem, styles.menu)}
            ref={dropdownToggler}
            onClick={toggleDropdown}
            aria-haspopup="menu"
            aria-label={t('Header.Menu')}
            aria-expanded={dropdownOpen}
          >
            <AppIcon icon={menuIcon} />
            <MenuBadge />
          </button>
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                key="dropdown"
                className={styles.dropdown}
                role="menu"
                initial="collapsed"
                animate="open"
                exit="collapsed"
                variants={menuAnimateVariants}
                transition={menuAnimateTransition}
              >
                <ClickOutside
                  ref={dropdownRef}
                  extraRef={dropdownToggler}
                  onClickOutside={hideDropdown}
                >
                  {destinyLinks}
                  <hr />
                  <NavLink className={navLinkClassName} to="/settings">
                    {t('Settings.Settings')}
                  </NavLink>
                  {!isPhonePortrait && (
                    <a className={styles.menuItem} onClick={showKeyboardHelp}>
                      {t('Header.KeyboardShortcuts')}
                    </a>
                  )}
                  <ExternalLink className={styles.menuItem} href={userGuideLink}>
                    {t('General.UserGuideLink')}
                  </ExternalLink>
                  {installable ? (
                    <a className={styles.menuItem} onClick={installDim}>
                      {t('Header.InstallDIM')}
                    </a>
                  ) : offerRelaunch ? (
                    <a className={styles.menuItem} onClick={reLaunchDim}>
                      {t('Header.LaunchDIMAlone')}{' '}
                      <AppIcon icon={faExternalLinkAlt} className={styles.launchSeparateIcon} />
                    </a>
                  ) : null}
                  {dimLinks}
                  <hr />
                  <MenuAccounts closeDropdown={hideDropdown} />
                </ClickOutside>
              </motion.div>
            )}
          </AnimatePresence>
          <Link to="/" className={clsx(styles.menuItem, styles.logoLink)}>
            <img
              className={clsx(styles.logo, logoStyles[$DIM_FLAVOR])}
              title={`v${$DIM_VERSION} (${$DIM_FLAVOR})`}
              src={logo}
              alt="DIM"
              aria-label="dim"
            />
          </Link>
          <div className={styles.headerLinks} ref={headerLinksRef}>
            {destinyLinks}
          </div>
          <div className={styles.headerRight}>
            {account && !isPhonePortrait && (
              <span className={styles.searchLink}>
                <SearchFilter onClear={hideSearch} ref={searchFilter} />
              </span>
            )}
            {streamDeckEnabled && <StreamDeckButton />}
            <RefreshButton className={styles.menuItem} />
            {!isPhonePortrait && (
              <Link className={styles.menuItem} to="/settings" title={t('Settings.Settings')}>
                <AppIcon icon={settingsIcon} />
              </Link>
            )}
            <button
              type="button"
              className={clsx(styles.menuItem, styles.searchButton)}
              onClick={toggleSearch}
            >
              <AppIcon icon={searchIcon} />
            </button>
          </div>
        </div>
        {account && isPhonePortrait && showSearch && (
          <span className="mobile-search-link">
            <SearchFilter onClear={hideSearch} ref={searchFilter} />
          </span>
        )}
        {isPhonePortrait && installable && <AppInstallBanner onClick={installDim} />}
        <PostmasterWarningBanner />
        {$featureFlags.warnNoSync && <DimApiWarningBanner />}
        {promptIosPwa && (
          <Sheet header={<h1>{t('Header.InstallDIM')}</h1>} onClose={() => setPromptIosPwa(false)}>
            <p className={styles.pwaPrompt}>{t('Header.IosPwaPrompt')}</p>
          </Sheet>
        )}
      </header>
    </PressTipRoot>
  );
}
