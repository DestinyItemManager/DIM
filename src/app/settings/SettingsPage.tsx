import * as React from 'react';
import { t, changeLanguage } from 'i18next';
import { setSetting, setCharacterOrder } from './actions';
import { RootState } from '../store/reducers';
import InventoryItem from '../inventory/InventoryItem';
import SortOrderEditor, { SortProperty } from './SortOrderEditor';
import CharacterOrderEditor from './CharacterOrderEditor';
import { connect } from 'react-redux';
import exampleWeaponImage from 'app/images/example-weapon.jpg';
import exampleArmorImage from 'app/images/example-armor.jpg';
import './settings.scss';
import { DimItem } from '../inventory/item-types';
import * as _ from 'lodash';
import { reviewPlatformOptions } from '../destinyTrackerApi/platformOptionsFetcher';
import { getReviewModes } from '../destinyTrackerApi/reviewModesFetcher';
import { downloadCsvFiles, importTagsNotesFromCsv } from '../inventory/dimCsvService.factory';
import { D2StoresService } from '../inventory/d2-stores.service';
import { D1StoresService } from '../inventory/d1-stores.service';
import { settings } from './settings';
import { storesLoadedSelector } from '../inventory/reducer';
import { getDefinitions, D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import Checkbox from './Checkbox';
import Select, { mapToOptions, listToOptions } from './Select';
import StorageSettings from '../storage/StorageSettings';
import { getPlatforms, getActivePlatform } from '../accounts/platform.service';
import { itemSortOrder } from './item-sort';
import { Settings, defaultItemSize } from './reducer';
import { AppIcon, refreshIcon, spreadsheetIcon, diagnosticsIcon } from '../shell/icons';
import { UISref } from '@uirouter/react';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import RatingsKey from '../item-review/RatingsKey';
import FileUpload from '../dim-ui/FileUpload';
import { DropFilesEventHandler } from 'react-dropzone';

interface StoreProps {
  settings: Settings;
  isPhonePortrait: boolean;
  storesLoaded: boolean;
}

function mapStateToProps(state: RootState) {
  return {
    settings: state.settings,
    isPhonePortrait: state.shell.isPhonePortrait,
    storesLoaded: storesLoadedSelector(state)
  };
}

const mapDispatchToProps = {
  setSetting,
  setCharacterOrder
};
type DispatchProps = typeof mapDispatchToProps;

type Props = StoreProps & DispatchProps;

interface State {
  defs?: D2ManifestDefinitions;
}

const fakeWeapon = {
  icon: `~${exampleWeaponImage}`,
  dtrRating: 4.9,
  dtrRatingCount: 100,
  dmg: 'void',
  isNew: true,
  location: {
    type: 'energy'
  },
  bucket: {
    type: 'energy'
  },
  visible: true,
  primStat: {
    value: 300
  },
  isDestiny2() {
    return true;
  },
  isDestiny1() {
    return false;
  }
};

const fakeArmor = {
  icon: `~${exampleArmorImage}`,
  quality: {
    min: 96
  },
  isNew: true,
  location: {
    type: 'energy'
  },
  bucket: {
    type: 'energy'
  },
  visible: true,
  primStat: {
    value: 300
  },
  isDestiny2() {
    return false;
  },
  isDestiny1() {
    return true;
  }
};

const languageOptions = mapToOptions({
  de: 'Deutsch',
  en: 'English',
  es: 'Español (España)',
  'es-mx': 'Español (México)',
  fr: 'Français',
  it: 'Italiano',
  ko: '한국어',
  pl: 'Polski',
  'pt-br': 'Português (Brasil)',
  ru: 'Русский',
  ja: '日本語',
  'zh-cht': '繁體中文', // Chinese (Traditional)
  'zh-chs': '简体中文' // Chinese (Simplified)
});

const itemSortProperties = {
  typeName: t('Settings.SortByType'),
  rarity: t('Settings.SortByRarity'),
  primStat: t('Settings.SortByPrimary'),
  amount: t('Settings.SortByAmount'),
  rating: t('Settings.SortByRating'),
  classType: t('Settings.SortByClassType'),
  name: t('Settings.SortName'),
  tag: t('Settings.SortByTag')
  // archetype: 'Archetype'
};

// Sorts not on this list will be converted to "custom". This can be a different
// list than the one in the settings service, since that list supports backwards
// compatibility with old settings.
const itemSortPresets = {
  primaryStat: 'Settings.SortPrimary',
  rarityThenPrimary: 'Settings.SortRarity',
  quality: 'Settings.SortRoll',
  name: 'Settings.SortName',
  custom: 'Settings.SortCustom'
};

const colorA11yOptions = $featureFlags.colorA11y
  ? listToOptions([
      '-',
      'Protanopia',
      'Protanomaly',
      'Deuteranopia',
      'Deuteranomaly',
      'Tritanopia',
      'Tritanomaly',
      'Achromatopsia',
      'Achromatomaly'
    ])
  : [];

// Edge doesn't support these
const supportsCssVar = window.CSS && window.CSS.supports && window.CSS.supports('(--foo: red)');

class SettingsPage extends React.Component<Props, State> {
  state: State = {};
  private initialLanguage = settings.language;

  componentDidMount() {
    getDefinitions().then((defs) => this.setState({ defs }));
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
    const { settings, isPhonePortrait, storesLoaded } = this.props;
    const { defs } = this.state;

    const charColOptions = _.range(3, 6).map((num) => ({
      value: num,
      name: t('Settings.ColumnSize', { num })
    }));
    const vaultColOptions = _.range(5, 21).map((num) => ({
      value: num,
      name: t('Settings.ColumnSize', { num })
    }));
    vaultColOptions.unshift({ value: 999, name: t('Settings.ColumnSizeAuto') });

    const reviewModeOptions = getReviewModes(defs).map((m) => ({
      name: m.description,
      value: m.mode
    }));

    const sortOrder = itemSortOrder(settings);
    if (!itemSortPresets[settings.itemSort]) {
      this.props.setSetting('itemSortOrderCustom', sortOrder);
      this.props.setSetting('itemSort', 'custom');
    }

    const itemSortCustom = _.sortBy(
      _.map(
        itemSortProperties,
        (displayName, id): SortProperty => {
          return {
            id,
            displayName,
            enabled: sortOrder.includes(id)
          };
        }
      ),
      (o) => {
        const index = sortOrder.indexOf(o.id);
        return index >= 0 ? index : 999;
      }
    );

    return (
      <div className="dim-page dim-static-page settings">
        <h1>{t('Settings.Settings')}</h1>
        <form>
          <h2>{t('Settings.General')}</h2>

          <section>
            <div className="setting">
              <Select
                label="Settings.Language"
                name="language"
                value={settings.language}
                options={languageOptions}
                onChange={this.changeLanguage}
              />
              {this.initialLanguage !== settings.language && (
                <div>
                  <button className="dim-button" onClick={this.reloadDim}>
                    <AppIcon icon={refreshIcon} /> <span>{t('Settings.ReloadDIM')}</span>
                  </button>
                </div>
              )}
            </div>

            <Select
              label="Settings.ColorA11y"
              name="colorA11y"
              value={settings.colorA11y}
              options={colorA11yOptions}
              onChange={this.onChange}
            />
          </section>

          <h2>{t('Settings.Items')}</h2>

          <section>
            <div className="examples">
              <InventoryItem
                item={(fakeWeapon as any) as DimItem}
                isNew={true}
                rating={4.6}
                tag="favorite"
              />
            </div>

            {supportsCssVar && !isPhonePortrait && (
              <div className="setting">
                <div className="horizontal itemSize">
                  <label htmlFor="itemSize">{t('Settings.SizeItem')}</label>
                  <input
                    value={settings.itemSize}
                    type="range"
                    min="48"
                    max="66"
                    name="itemSize"
                    onChange={this.onChange}
                  />
                  {Math.max(48, settings.itemSize)}px
                  <button className="dim-button" onClick={this.resetItemSize}>
                    {t('Settings.ResetToDefault')}
                  </button>
                </div>
                <div className="fineprint">{t('Settings.DefaultItemSizeNote')}</div>
              </div>
            )}

            <Checkbox
              label="Settings.ShowNewItems"
              name="showNewItems"
              value={settings.showNewItems}
              onChange={this.onChange}
            />

            <div className="setting">
              <label htmlFor="itemSort">{t('Settings.SetSort')}</label>

              <div className="radioOptions">
                {_.map(itemSortPresets, (i18nkey, value) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="itemSort"
                      value={value}
                      checked={settings.itemSort === value}
                      onChange={this.onChange}
                    />
                    <span>{t(i18nkey)}</span>
                  </label>
                ))}
              </div>
              {settings.itemSort === 'custom' && (
                <SortOrderEditor
                  order={itemSortCustom}
                  onSortOrderChanged={this.itemSortOrderChanged}
                />
              )}
              <div className="fineprint">{t('Settings.DontForgetDupes')}</div>
            </div>
          </section>

          <h2>{t('Settings.Ratings')}</h2>

          <section>
            <div className="examples">
              <InventoryItem item={(fakeWeapon as any) as DimItem} rating={4.9} isNew={true} />
              <InventoryItem item={(fakeArmor as any) as DimItem} isNew={true} />
            </div>

            <Checkbox
              label="Settings.EnableAdvancedStats"
              name="itemQuality"
              value={settings.itemQuality}
              onChange={this.onChange}
            />

            {$featureFlags.reviewsEnabled && (
              <>
                <div className="setting">
                  <Checkbox
                    label="Settings.ShowReviews"
                    name="showReviews"
                    helpLink="https://github.com/DestinyItemManager/DIM/blob/master/docs/RATINGS.md"
                    value={settings.showReviews}
                    onChange={this.onChange}
                  />
                  <RatingsKey />
                </div>
                <div className="setting">
                  <Checkbox
                    label="Settings.AllowIdPostToDtr"
                    name="allowIdPostToDtr"
                    helpLink="https://github.com/DestinyItemManager/DIM/blob/master/docs/PRIVACY.md"
                    value={settings.allowIdPostToDtr}
                    onChange={this.onChange}
                  />
                  <div className="fineprint">{t('Settings.AllowIdPostToDtrLine2')}</div>
                </div>

                {settings.allowIdPostToDtr && (
                  <>
                    <Select
                      label="Settings.ReviewsPlatformSelection"
                      name="reviewsPlatformSelection"
                      value={settings.reviewsPlatformSelection}
                      options={reviewPlatformOptions.map((o) => ({
                        name: t(o.description),
                        value: o.platform
                      }))}
                      onChange={this.saveAndReloadReviews}
                    />

                    <Select
                      label="Settings.ReviewsModeSelection"
                      name="reviewsModeSelection"
                      value={settings.reviewsModeSelection}
                      options={reviewModeOptions}
                      onChange={this.saveAndReloadReviews}
                    />
                  </>
                )}
              </>
            )}
          </section>

          <h2>{t('Settings.Inventory')}</h2>

          <section>
            <div className="setting">
              <label>{t('Settings.CharacterOrder')}</label>
              <div className="radioOptions">
                <label>
                  <input
                    type="radio"
                    name="characterOrder"
                    checked={settings.characterOrder === 'mostRecent'}
                    value="mostRecent"
                    onChange={this.onChange}
                  />
                  <span>{t('Settings.CharacterOrderRecent')}</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="characterOrder"
                    checked={settings.characterOrder === 'mostRecentReverse'}
                    value="mostRecentReverse"
                    onChange={this.onChange}
                  />
                  <span>{t('Settings.CharacterOrderReversed')}</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="characterOrder"
                    checked={settings.characterOrder === 'fixed'}
                    value="fixed"
                    onChange={this.onChange}
                  />
                  <span>{t('Settings.CharacterOrderFixed')}</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="characterOrder"
                    checked={settings.characterOrder === 'custom'}
                    value="custom"
                    onChange={this.onChange}
                  />
                  <span>{t('Settings.SortCustom')}</span>
                </label>
                {settings.characterOrder === 'custom' && (
                  <CharacterOrderEditor onSortOrderChanged={this.characterSortOrderChanged} />
                )}
              </div>
            </div>

            {supportsCssVar &&
              (isPhonePortrait ? (
                <div className="setting">
                  <Select
                    label="Settings.InventoryColumnsMobile"
                    name="charColMobile"
                    value={settings.charColMobile}
                    options={charColOptions}
                    onChange={this.onChange}
                  />
                  <div className="fineprint">{t('Settings.InventoryColumnsMobileLine2')}</div>
                </div>
              ) : (
                <Select
                  label="Settings.InventoryColumns"
                  name="charCol"
                  value={settings.charCol}
                  options={charColOptions}
                  onChange={this.onChange}
                />
              ))}
          </section>

          <ErrorBoundary name="StorageSettings">
            <StorageSettings />
          </ErrorBoundary>

          <h2>{t('Settings.Data')}</h2>

          <section>
            <div className="setting horizontal">
              <label htmlFor="spreadsheetLinks" title={t('Settings.ExportSSHelp')}>
                {t('Settings.ExportSS')}
              </label>
              <div>
                <button
                  className="dim-button"
                  onClick={this.downloadWeaponCsv}
                  disabled={!storesLoaded}
                >
                  <AppIcon icon={spreadsheetIcon} /> <span>{t('Bucket.Weapons')}</span>
                </button>{' '}
                <button
                  className="dim-button"
                  onClick={this.downloadArmorCsv}
                  disabled={!storesLoaded}
                >
                  <AppIcon icon={spreadsheetIcon} /> <span>{t('Bucket.Armor')}</span>
                </button>{' '}
                <button
                  className="dim-button"
                  onClick={this.downloadGhostCsv}
                  disabled={!storesLoaded}
                >
                  <AppIcon icon={spreadsheetIcon} /> <span>{t('Bucket.Ghost')}</span>
                </button>
              </div>
            </div>
            <div className="setting">
              <FileUpload title={t('Settings.CsvImport')} accept=".csv" onDrop={this.importCsv} />
            </div>
          </section>

          <section>
            <div className="setting">
              <h2>{t('Diagnostics.Title')}</h2>
              <UISref to="diagnostics" params={{}}>
                <a className="dim-button">
                  <AppIcon icon={diagnosticsIcon} /> {t('Diagnostics.View')}
                </a>
              </UISref>
            </div>
          </section>
        </form>
      </div>
    );
  }

  private onChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
    if (e.target.name.length === 0) {
      console.error(new Error('You need to have a name on the form input'));
    }

    if (isInputElement(e.target) && e.target.type === 'checkbox') {
      this.props.setSetting(e.target.name as any, e.target.checked);
    } else {
      this.props.setSetting(e.target.name as any, e.target.value);
    }
  };

  private changeLanguage = (e) => {
    const language = e.target.value;
    this.onChange(e);

    localStorage.setItem('dimLanguage', language);
    changeLanguage(language, () => {
      this.setState({});
    });
  };

  private importCsv: DropFilesEventHandler = async (acceptedFiles) => {
    if (acceptedFiles.length < 1) {
      alert(t('Csv.ImportWrongFileType'));
      return;
    }

    if (!confirm(t('Csv.ImportConfirm'))) {
      return;
    }
    try {
      const result = await importTagsNotesFromCsv(acceptedFiles);
      alert(t('Csv.ImportSuccess', { count: result }));
    } catch (e) {
      alert(t('Csv.ImportFailed', { error: e.message }));
    }
  };

  private downloadWeaponCsv = (e) => {
    e.preventDefault();
    this.downloadCsv('Weapons');
    return false;
  };

  private downloadArmorCsv = (e) => {
    e.preventDefault();
    this.downloadCsv('Armor');
    return false;
  };

  private downloadGhostCsv = (e) => {
    e.preventDefault();
    this.downloadCsv('Ghost');
    return false;
  };

  private downloadCsv = (type: 'Armor' | 'Weapons' | 'Ghost') => {
    const activePlatform = getActivePlatform();
    if (!activePlatform) {
      return;
    }
    downloadCsvFiles(
      activePlatform.destinyVersion === 2
        ? D2StoresService.getStores()
        : D1StoresService.getStores(),
      type
    );
    ga('send', 'event', 'Download CSV', type);
  };

  private resetItemSize = (e) => {
    e.preventDefault();
    this.props.setSetting('itemSize', defaultItemSize());
    return false;
  };

  private saveAndReloadReviews = (e) => {
    e.preventDefault();
    this.onChange(e);
    D2StoresService.refreshRatingsData();
    return false;
  };

  private reloadDim = (e) => {
    e.preventDefault();
    window.location.reload(false);
    return false;
  };

  private itemSortOrderChanged = (sortOrder: SortProperty[]) => {
    this.props.setSetting(
      'itemSortOrderCustom',
      sortOrder.filter((o) => o.enabled).map((o) => o.id)
    );
  };

  private characterSortOrderChanged = (order: string[]) => {
    this.props.setCharacterOrder(order);
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SettingsPage);

function isInputElement(element: HTMLElement): element is HTMLInputElement {
  return element.nodeName === 'INPUT';
}
