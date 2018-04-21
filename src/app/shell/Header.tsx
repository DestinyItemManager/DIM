import { angular2react } from 'angular2react';
import classNames from 'classnames';
import { t } from 'i18next';
import { $injector } from 'ngimport';
import * as React from 'react';
import { Subscription } from 'rxjs/Subscription';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { getActiveAccountStream } from '../accounts/platform.service';
import { $state, $transitions, ngDialog } from '../ngimport-more';
import { SearchFilterComponent } from '../search/search-filter.component';
import { StoreServiceType } from '../inventory/d2-stores.service';
import AccountSelect from '../accounts/account-select';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import Link from './Link';
import './header.scss';

// tslint:disable-next-line:no-implicit-dependencies
import logo from 'app/images/logo-type-right-light.svg';
import ClickOutside from '../dim-ui/click-outside';
import Refresh from './refresh';
import { IScope } from 'angular';
import RatingMode from './rating-mode/RatingMode';
import { settings } from '../settings/settings';
import { getDefinitions, D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import WhatsNewLink from '../whats-new/WhatsNewLink';
import MenuBadge from './MenuBadge';

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
  defs?: D2ManifestDefinitions;
}

interface Props {
  $scope: IScope;
  D2StoresService: StoreServiceType;
}

export default class Header extends React.Component<Props, State> {
  private vendorsSubscription: Subscription;
  private accountSubscription: Subscription;
  // tslint:disable-next-line:ban-types
  private unregisterTransitionHooks: Function[];
  private showXur = showPopupFunction('xur', '<xur></xur>');
  private dropdownToggler = React.createRef<HTMLElement>();

  private SearchFilter: React.ComponentClass<{ account: DestinyAccount }>;

  constructor(props) {
    super(props);

    this.SearchFilter = angular2react<{ account: DestinyAccount }>('dimSearchFilter', SearchFilterComponent, $injector);

    this.state = {
      xurAvailable: false,
      dropdownOpen: false,
      showSearch: false,
      defs: undefined
    };
  }

  async getDefinitions(account?: DestinyAccount) {
    if (!account || account.destinyVersion !== 2) {
      return;
    }

    const defs = await getDefinitions();

    this.setState({ defs });
  }

  componentDidMount() {
    this.accountSubscription = getActiveAccountStream().subscribe((account) => {
      this.setState({ account: account || undefined });

      this.getDefinitions(account || undefined);
    });

    this.unregisterTransitionHooks = [
      $transitions.onBefore({}, () => {
        this.setState({ dropdownOpen: false });
      }),
      $transitions.onSuccess({ to: 'destiny1.*' }, () => {
        this.updateXur();
      })
    ];

    // Gonna have to figure out a better solution for this in React
    this.props.$scope.$on('i18nextLanguageChange', () => {
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
    const { account, showSearch, dropdownOpen, xurAvailable, defs } = this.state;
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
              timeout={{ enter: 500, exit: 3000 }}
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

        <img
          className={classNames('logo', 'link', $DIM_FLAVOR)}
          onClick={this.goToDefaultAccount}
          title={`v${$DIM_VERSION} (${$DIM_FLAVOR})`}
          src={logo}
          alt="DIM"
        />

        <div className="header-links">
          {reverseDestinyLinks}
          {reverseDimLinks}
        </div>

        <span className="header-right">
          {!showSearch && <Refresh/>}
          {(!showSearch && account && account.destinyVersion === 2 && settings.showReviews && defs) && <RatingMode defs={defs} D2StoresService={this.props.D2StoresService} />}
          {!showSearch &&
            <a
              className="link fa fa-cog"
              onClick={this.goToSettings}
              title={t('Settings.Settings')}
            />}
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

  private goToDefaultAccount = () => {
    $state.go('default-account');
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

  private goToSettings = () => {
    $state.go('settings');
  }

  private updateXur() {
    if (this.state.account && this.state.account.destinyVersion === 1 && !this.vendorsSubscription) {
      const dimVendorService: any = $injector.get('dimVendorService'); // hack for code splitting

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
