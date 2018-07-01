import { angular2react } from 'angular2react';
import classNames from 'classnames';
import { t } from 'i18next';
import * as React from 'react';
import { Subscription } from 'rxjs/Subscription';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { getActiveAccountStream } from '../accounts/platform.service';
import { ngDialog } from '../ngimport-more';
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
import { IRootScopeService } from 'angular';
import RatingMode from './rating-mode/RatingMode';
import { settings } from '../settings/settings';
import WhatsNewLink from '../whats-new/WhatsNewLink';
import MenuBadge from './MenuBadge';
import { dimVendorService } from '../vendors/vendor.service';
import { UISref } from '@uirouter/react';

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
  }
];

if ($featureFlags.vendors) {
  destiny2Links.push({
    state: 'destiny2.vendors',
    text: 'Vendors.Vendors'
  }, {
    state: 'destiny2.collections',
    text: 'Vendors.Collections'
  });
}

interface State {
  xurAvailable: boolean;
  account?: DestinyAccount;
  dropdownOpen: boolean;
  showSearch: boolean;
}

interface Props {
  $rootScope: IRootScopeService;
}

export default class Header extends React.PureComponent<Props, State> {
  private vendorsSubscription: Subscription;
  private accountSubscription: Subscription;
  // tslint:disable-next-line:ban-types
  private unregisterTransitionHooks: Function[] = [];
  private showXur = showPopupFunction('xur', '<xur></xur>');
  private dropdownToggler = React.createRef<HTMLElement>();

  private SearchFilter: React.ComponentClass<{ account: DestinyAccount }>;

  constructor(props) {
    super(props);

    this.SearchFilter = angular2react<{ account: DestinyAccount }>('dimSearchFilter', SearchFilterComponent);

    this.state = {
      xurAvailable: false,
      dropdownOpen: false,
      showSearch: false
    };
  }

  componentDidMount() {
    this.accountSubscription = getActiveAccountStream().subscribe((account) => {
      this.setState({ account: account || undefined });
    });

    this.unregisterTransitionHooks = [
      router.transitionService.onBefore({}, () => {
        this.setState({ dropdownOpen: false });
      }),
      router.transitionService.onSuccess({ to: 'destiny1.*' }, () => {
        this.updateXur();
      })
    ];

    // Gonna have to figure out a better solution for this in React
    this.props.$rootScope.$on('i18nextLanguageChange', () => {
      this.setState({}); // gross, force re-render
    });
  }

  componentWillUnmount() {
    this.unregisterTransitionHooks.forEach((f) => f());
    this.accountSubscription.unsubscribe();
    if (this.vendorsSubscription) {
      this.vendorsSubscription.unsubscribe();
    }
  }

  render() {
    const { account, showSearch, dropdownOpen, xurAvailable } = this.state;
    const { SearchFilter } = this;

    // TODO: new fontawesome
    const bugReportLink = $DIM_FLAVOR !== 'release';

    // Generic links about DIM
    const dimLinks = (
      <>
        <Link state='about' text='Header.About'/>
        <Link state='support' text='Header.SupportDIM'/>
        <ExternalLink href='https://teespring.com/stores/dim' text='Header.Shop'/>
        <WhatsNewLink />
        {bugReportLink &&
          <ExternalLink
            href="https://github.com/DestinyItemManager/DIM/issues"
            text="Header.ReportBug"
          />}
      </>
    );

    const links = account
      ? account.destinyVersion === 1 ? destiny1Links : destiny2Links
      : [];

    // Links about the current Destiny version
    const destinyLinks = (
      <>
        {links.map((link) =>
          <Link
            key={link.state}
            account={account}
            state={link.state}
            text={link.text}
          />
        )}
        {account && account.destinyVersion === 1 && xurAvailable &&
          <a className="link" onClick={this.showXur}>Xûr</a>}
      </>
    );

    const reverseDestinyLinks = (
      <>
        {account && account.destinyVersion === 1 && xurAvailable &&
          <a className="link" onClick={this.showXur}>Xûr</a>}
        {links.slice().reverse().map((link) =>
          <Link
            key={link.state}
            account={account}
            state={link.state}
            text={link.text}
          />
        )}
      </>
    );
    const reverseDimLinks = (
      <>
      {links.length > 0 && <span className="header-separator"/>}
      {bugReportLink &&
        <ExternalLink
          href="https://github.com/DestinyItemManager/DIM/issues"
          text="Header.ReportBug"
        />}
        <WhatsNewLink />
        <ExternalLink href='https://teespring.com/stores/dim' text='Header.Shop'/>
        <Link state='support' text='Header.SupportDIM'/>
        <Link state='about' text='Header.About'/>
      </>
    );

    return (
      <div id="header">
        <span className="menu link" ref={this.dropdownToggler} onClick={this.toggleDropdown}>
          <i className="fa fa-bars" />
          <MenuBadge />
        </span>

        <TransitionGroup>
          {dropdownOpen &&
            <CSSTransition
              classNames="dropdown"
              timeout={{ enter: 500, exit: 500 }}
            >
              <ClickOutside key="dropdown" className="dropdown" onClickOutside={this.hideDropdown}>
                {destinyLinks}
                {links.length > 0 && <hr/>}
                <Link state='settings' text='Settings.Settings'/>
                <hr/>
                {dimLinks}
              </ClickOutside>
            </CSSTransition>}
        </TransitionGroup>

        <UISref to='default-account'>
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
          {!showSearch && <Refresh/>}
          {(!showSearch && account && account.destinyVersion === 2 && settings.showReviews) &&
            <RatingMode />}
          {!showSearch &&
            <UISref to='settings'>
              <a
                className="link fa fa-cog"
                title={t('Settings.Settings')}
              />
            </UISref>}
          {account &&
            <span className={classNames("link", "search-link", { show: showSearch })}>
              <SearchFilter account={account}/>
            </span>}
          <span className="link search-button" onClick={this.toggleSearch}>
            <i className="fa fa-search"/>
          </span>
          {account && <AccountSelect currentAccount={account} />}
        </span>
      </div>
    );
  }

  private toggleDropdown = () => {
    this.setState({ dropdownOpen: !this.state.dropdownOpen });
  }

  private hideDropdown = (event) => {
    if (!this.dropdownToggler.current || !this.dropdownToggler.current.contains(event.target)) {
      this.setState({ dropdownOpen: false });
    }
  }

  private toggleSearch = () => {
    this.setState({ showSearch: !this.state.showSearch });
  }

  private updateXur() {
    if (this.state.account && this.state.account.destinyVersion === 1 && !this.vendorsSubscription) {
      this.vendorsSubscription = dimVendorService.getVendorsStream(this.state.account).subscribe(([_stores, vendors]) => {
        const xur = 2796397637;
        this.setState({ xurAvailable: Boolean(vendors[xur]) });
      });
    }
  }
}

/**
 * Show a popup dialog containing the given template. Its class
 * will be based on the name.
 */
function showPopupFunction(name, template) {
  let result;
  return (e) => {
    e.stopPropagation();

    if (result) {
      result.close();
    } else {
      ngDialog.closeAll();
      result = ngDialog.open({
        template,
        className: name,
        appendClassName: 'modal-dialog'
      });

      result.closePromise.then(() => {
        result = null;
      });
    }
  };
}

function ExternalLink({
  href,
  text
}: {
  href: string;
  text: string;
}) {
  return (
    <a className="link" target="_blank" rel="noopener noreferrer" href={href}>{t(text)}</a>
  );
}
