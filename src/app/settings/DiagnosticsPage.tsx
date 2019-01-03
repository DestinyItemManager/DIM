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
import copyString from '../copy-string';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { DimStore } from '../inventory/store-types';

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
    }
  };
}

interface Props {
  user: {
    current: DestinyAccount | undefined;
    accounts: ReadonlyArray<DestinyAccount>;
    characters: ReadonlyArray<{
      current: DimStore['current'];
      class: DimStore['class'];
      destinyVersion: DimStore['destinyVersion'];
      id: DimStore['id'];
      name: DimStore['name'];
    }>;
  };
}

const backticks = '```';
const stringToCodeBlock = (str: string) => `${backticks}\n${str}\n${backticks}`;

const copyStringOnClick = (content: string) => () => {
  copyString(content);
  return false;
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
          buildDate: new Date($DIM_BUILD_DATE).toISOString()
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
            <button
              className="dim-button"
              onClick={copyStringOnClick(stringToCodeBlock(generalDiagnostics))}
            >
              <AppIcon icon={copyIcon} /> {t('Diagnostics.CopyToClipboard')}
            </button>
            <pre id="general-diagnostics">{generalDiagnostics}</pre>
          </div>
        </section>
      </div>
    );
  }
}

export default connect(mapStateToProps)(DiagnosticsPageComponent);
