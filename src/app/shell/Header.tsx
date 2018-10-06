import { angular2react } from 'angular2react';
import classNames from 'classnames';
import { t } from 'i18next';
import * as React from 'react';
import { Subscription } from 'rxjs/Subscription';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { getActiveAccountStream } from '../accounts/platform.service';
import { SearchFilterComponent } from '../search/search-filter.component';
import AccountSelect from '../accounts/account-select';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import Link from './Link';
import { router } from '../../router';
import './header.scss';

// tslint:disable-next-line:no-implicit-dependencies
import logo from 'app/images/logo-type-right-light.svg';
import ClickOutside from '../dim-ui/ClickOutside';
import Refresh from './refresh';
import RatingMode from './rating-mode/RatingMode';
import { settings } from '../settings/settings';
import WhatsNewLink from '../whats-new/WhatsNewLink';
import MenuBadge from './MenuBadge';
import { UISref } from '@uirouter/react';
import {
  dimVendorEngramsService,
  isVerified380
} from '../vendorEngramsXyzApi/vendorEngramsXyzService';
import { AppIcon, menuIcon, searchIcon, settingsIcon } from './icons';

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
  vendorEngramDropActive: boolean;
}

export default class Header extends React.PureComponent<{}, State> {
  private accountSubscription: Subscription;
  // tslint:disable-next-line:ban-types
  private unregisterTransitionHooks: Function[] = [];
  private dropdownToggler = React.createRef<HTMLElement>();
  private engramRefreshTimer: number;

  private SearchFilter: React.ComponentClass<{ account: DestinyAccount }>;

  constructor(props) {
    super(props);

    this.SearchFilter = angular2react<{ account: DestinyAccount }>(
      'dimSearchFilter',
      SearchFilterComponent
    );

    this.state = {
      dropdownOpen: false,
      showSearch: false,
      vendorEngramDropActive: false
    };
  }

  componentDidMount() {
    this.accountSubscription = getActiveAccountStream().subscribe((account) => {
      this.setState({ account: account || undefined });
      this.updateVendorEngrams(account || undefined);
    });

    this.unregisterTransitionHooks = [
      router.transitionService.onBefore({}, () => {
        this.setState({ dropdownOpen: false });
      })
    ];
  }

  componentWillUnmount() {
    this.unregisterTransitionHooks.forEach((f) => f());
    this.accountSubscription.unsubscribe();
    this.stopPollingVendorEngrams();
  }

  render() {
    const { account, showSearch, dropdownOpen, vendorEngramDropActive } = this.state;
    const { SearchFilter } = this;

    // TODO: new fontawesome
    const bugReportLink = $DIM_FLAVOR !== 'release';

    // Generic links about DIM
    const dimLinks = (
      <>
        <Link state="about" text="Header.About" />
        <Link state="support" text="Header.SupportDIM" />
        <ExternalLink href={shopLink} text="Header.Shop" />
        <WhatsNewLink />
        {bugReportLink && <ExternalLink href={bugReport} text="Header.ReportBug" />}
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
            <Link
              key={link.state}
              account={account}
              state={link.state}
              text={link.text}
              showWhatsNew={link.state === 'destiny2.vendors' && vendorEngramDropActive}
            />
          ))}
      </>
    );
    const reverseDimLinks = (
      <>
        {links.length > 0 && <span className="header-separator" />}
        {bugReportLink && <ExternalLink href={bugReport} text="Header.ReportBug" />}
        <WhatsNewLink />
        <ExternalLink href={shopLink} text="Header.Shop" />
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
                <hr />
                {dimLinks}
              </ClickOutside>
            </CSSTransition>
          )}
        </TransitionGroup>

        {!showSearch && (
          <UISref to="default-account">
            <img
              className={classNames('logo', 'link', $DIM_FLAVOR)}
              title={`v${$DIM_VERSION} (${$DIM_FLAVOR})`}
              src={logo}
              alt="DIM"
            />
          </UISref>
        )}

        {!showSearch && (
          <div className="header-links">
            {reverseDestinyLinks}
            {reverseDimLinks}
          </div>
        )}

        <span className="header-right">
          {!showSearch && <Refresh />}
          {!showSearch &&
            account &&
            account.destinyVersion === 2 &&
            settings.showReviews && <RatingMode />}
          {!showSearch && (
            <UISref to="settings">
              <a className="link" title={t('Settings.Settings')}>
                <AppIcon icon={settingsIcon} />
              </a>
            </UISref>
          )}
          {account && (
            <span className={classNames('link', 'search-link', { show: showSearch })}>
              <SearchFilter account={account} />
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

  private updateVendorEngrams = (account = this.state.account) => {
    if (!$featureFlags.vendorEngrams || !account || account.destinyVersion !== 2) {
      this.stopPollingVendorEngrams();
      return;
    }

    dimVendorEngramsService.getAllVendorDrops().then((vds) => {
      const anyActive = vds.some(isVerified380);
      this.setState({ vendorEngramDropActive: anyActive });
    });

    if (!this.engramRefreshTimer) {
      this.engramRefreshTimer = window.setInterval(
        this.updateVendorEngrams,
        dimVendorEngramsService.refreshInterval
      );
    }
  };

  private stopPollingVendorEngrams = () => {
    if (this.engramRefreshTimer) {
      clearInterval(this.engramRefreshTimer);
      this.engramRefreshTimer = 0;
    }
  };

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
}

function ExternalLink({ href, text }: { href: string; text: string }) {
  return (
    <a className="link" target="_blank" rel="noopener noreferrer" href={href}>
      {t(text)}
    </a>
  );
}
