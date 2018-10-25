import * as React from 'react';
import { connect } from 'react-redux';
import { RootState } from '../store/reducers';
import { t } from 'i18next';
import './DiagnosticsPage.scss';
import { AppIcon, copyIcon } from '../shell/icons';
import { currentAccountSelector } from '../accounts/reducer';
import { getPlatforms, getActivePlatform } from '../accounts/platform.service';
import { D2StoresService } from '../inventory/d2-stores.service';
import { D1StoresService } from '../inventory/d1-stores.service';

function mapStateToProps(state: RootState): Partial<Props> {
  return {
    user: {
      current: currentAccountSelector(state),
      accounts: state.accounts.accounts,
      // using the stores map directly locks up the page in an infinite loop
      characters:
        state.inventory.stores &&
        state.inventory.stores.map((store) => ({
          current: store.current,
          class: store.class,
          destinyVersion: store.destinyVersion,
          id: store.id,
          name: store.name
        }))
    },
    account: state
  };
}

interface Props {
  user: {
    current: any;
    accounts: any;
    characters: any;
  };
  account: any;
}

const selectElementContent = (id: string) => () => {
  const el = document.getElementById(id);

  if (el) {
    window.getSelection().selectAllChildren(el);
  }
};

class DiagnosticsPageComponent extends React.Component<Props> {
  componentDidMount() {
    getPlatforms().then(() => {
      const account = getActivePlatform();
      if (account) {
        account.destinyVersion === 2
          ? D2StoresService.getStoresStream(account)
          : D1StoresService.getStoresStream(account);
      }
    });
  }

  render() {
    const generalDiagnostics = JSON.stringify(
      {
        user: this.props.user,
        app: {
          version: $DIM_VERSION,
          flavor: $DIM_FLAVOR,
          buildDate: new Date($DIM_BUILD_DATE).toISOString(),
          featureFlags: {
            debugMoves: $featureFlags.debugMoves,
            reviewsEnabled: $featureFlags.reviewsEnabled,
            gdrive: $featureFlags.gdrive,
            debugSync: $featureFlags.debugSync,
            wasm: $featureFlags.wasm,
            colorA11y: $featureFlags.colorA11y,
            googleAnalyticsForRouter: $featureFlags.googleAnalyticsForRouter,
            debugRouter: $featureFlags.debugRouter,
            debugSW: $featureFlags.debugSW,
            sentry: $featureFlags.sentry,
            respectDNT: $featureFlags.respectDNT,
            forsakenTiles: $featureFlags.forsakenTiles,
            d2LoadoutBuilder: $featureFlags.d2LoadoutBuilder
          }
        }
      },
      undefined,
      2
    );

    return (
      <div className="dim-page dim-static-page">
        <h2>{t('Diagnostics.Title')}</h2>

        <section>
          <h3>{t('Diagnostics.General.Title')}</h3>
          <p>{t('Diagnostics.General.Detail')}</p>
          <p>{t('Diagnostics.General.Privacy')}</p>

          <div className="diagnostic-info">
            <button className="dim-button" onClick={selectElementContent('general-diagnostics')}>
              <AppIcon icon={copyIcon} /> {t('Diagnostics.SelectToCopyToClipboard')}
            </button>
            <pre id="general-diagnostics">{generalDiagnostics}</pre>
          </div>
        </section>
      </div>
    );
  }
}

export const DiagnosticsPage = connect(mapStateToProps)(DiagnosticsPageComponent);

export default DiagnosticsPage;
