import { angular2react } from 'angular2react';
import classNames from 'classnames';
import { t } from 'i18next';
import { $injector } from 'ngimport';
import * as React from 'react';
import { Subscription } from 'rxjs/Subscription';
import { AccountSelectComponent } from '../accounts/account-select.component';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { getActiveAccountStream } from '../accounts/platform.service';
import { $state, $transitions, ngDialog } from '../ngimport-more';
import { SearchFilterComponent } from '../search/search-filter.component';
import './header.scss';

// tslint:disable-next-line:no-implicit-dependencies
import logo from 'app/images/logo-type-right-light.svg';
import ClickOutside from '../dim-ui/click-outside';
import Refresh from './refresh';

interface State {
  xurAvailable: boolean;
  account?: DestinyAccount;
  dropdownOpen: boolean;
  showSearch: boolean;
}

export default class Header extends React.Component<{}, State> {
  private vendorsSubscription: Subscription;
  private accountSubscription: Subscription;
  // tslint:disable-next-line:ban-types
  private unregisterTransitionHook: Function;
  private showXur = showPopupFunction('xur', '<xur></xur>');

  private AccountSelect: React.ComponentClass<{ currentAccount: DestinyAccount }>;
  private SearchFilter: React.ComponentClass<{ account: DestinyAccount }>;

  constructor(props) {
    super(props);

    this.AccountSelect = angular2react<{ currentAccount: DestinyAccount }>('accountSelect', AccountSelectComponent, $injector);
    this.SearchFilter = angular2react<{ account: DestinyAccount }>('dimSearchFilter', SearchFilterComponent, $injector);

    this.state = {
      xurAvailable: false,
      dropdownOpen: false,
      showSearch: true
    };
  }

  componentDidMount() {
    this.accountSubscription = getActiveAccountStream().subscribe((account) => {
      this.setState({ account: account || undefined });
    });

    this.unregisterTransitionHook = $transitions.onSuccess({ to: 'destiny1.*' }, () => {
      this.updateXur();
    });

    // TODO: watch taps/clicks on document, close dropdown if outside dropdown
  }

  componentWillUnmount() {
    this.unregisterTransitionHook();
    this.accountSubscription.unsubscribe();
    if (this.vendorsSubscription) {
      this.vendorsSubscription.unsubscribe();
    }
  }

  render() {
    const { account, showSearch, dropdownOpen, xurAvailable } = this.state;
    const { AccountSelect, SearchFilter } = this;

    // TODO: one link map, rendered twice
    // TODO: new fontawesome
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

    const bugReportLink = $DIM_FLAVOR !== 'release';

    const dimLinks = (
      <>
        <Link state='about' text='Header.About'/>
        <Link state='support' text='Header.SupportDIM'/>
        <ExternalLink href='https://teespring.com/stores/dim' text='Header.Shop'/>
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

    return (
      <div id="header">
        <span className="menu link" onClick={this.toggleDropdown}>
          <i className="fa fa-bars" />
          {dropdownOpen &&
            <ClickOutside className="dropdown" onClickOutside={this.toggleDropdown}>
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

              {links.length > 0 && <hr/>}

              <Link state='settings' text='Settings.Settings'/>

              <hr/>

              {dimLinks}
            </ClickOutside>}
        </span>

        <img
          className={`logo link ${$DIM_FLAVOR}`}
          ui-sref="default-account"
          title={`v${$DIM_VERSION} (${$DIM_FLAVOR})`}
          src={logo}
          alt="DIM"
        />

        {dimLinks}

        {links.length > 0 && <span className="link first-to-go header-separator"/>}

        {links.map((link) =>
          <Link
            key={link.state}
            account={account}
            state={link.state}
            text={link.text}
          />
        )}

        <span className="header-right">
          {showSearch && <Refresh/>}
          {showSearch &&
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

  private toggleDropdown = () => {
    this.setState({ dropdownOpen: !this.state.dropdownOpen });
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

class Link extends React.Component<{
  account?: DestinyAccount;
  state: string;
  text: string;
}, {
  active: boolean;
}> {
  private listener;

  constructor(props) {
    super(props);
    this.state = { active: false };
  }

  componentDidMount() {
    this.listener = $transitions.onEnter({}, (_transition, state) => {
      this.setState({ active: (state.name === this.props.state) });
    });
  }

  componentWillUnmount() {
    this.listener();
  }

  render() {
    const { text } = this.props;
    const { active } = this.state;

    return (
      <a className={active ? 'link active' : 'link'} onClick={this.clicked}>{t(text)}</a>
    );
  }

  private clicked = () => {
    const { state, account } = this.props;
    $state.go(state, account);
  }
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
