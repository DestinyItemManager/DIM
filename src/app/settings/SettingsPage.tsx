import React, { useEffect, useState } from 'react';
import { t } from 'app/i18next-t';
import i18next from 'i18next';
import { setSetting, setCharacterOrder } from './actions';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import InventoryItem from '../inventory/InventoryItem';
import SortOrderEditor, { SortProperty } from './SortOrderEditor';
import CharacterOrderEditor from './CharacterOrderEditor';
import { connect } from 'react-redux';
import exampleWeaponImage from 'images/example-weapon.jpg';
import exampleArmorImage from 'images/example-armor.jpg';
import './settings.scss';
import { DimItem } from '../inventory/item-types';
import _ from 'lodash';
import { reviewPlatformOptions } from '../destinyTrackerApi/platformOptionsFetcher';
import { D2ReviewMode } from '../destinyTrackerApi/reviewModesFetcher';
import { D2StoresService } from '../inventory/d2-stores';
import { D1StoresService } from '../inventory/d1-stores';
import Checkbox from './Checkbox';
import Select, { mapToOptions, listToOptions } from './Select';
import { getPlatforms } from '../accounts/platforms';
import { getActivePlatform } from '../accounts/get-active-platform';
import { itemSortOrder } from './item-sort';
import { Settings } from './initial-settings';
import { settingsSelector } from './reducer';
import { AppIcon, refreshIcon } from '../shell/icons';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import RatingsKey from '../item-review/RatingsKey';
import { getDefinitions } from '../destiny2/d2-definitions';
import { reviewModesSelector } from '../item-review/reducer';
import WishListSettings from 'app/settings/WishListSettings';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import { itemTagList } from 'app/inventory/dim-item-info';
import Spreadsheets from './Spreadsheets';
import DimApiSettings from 'app/storage/DimApiSettings';
import { clearRatings } from 'app/item-review/actions';
import { fetchRatings } from 'app/item-review/destiny-tracker.service';
import { emptyArray } from 'app/utils/empty';
import { storesLoadedSelector, sortedStoresSelector } from 'app/inventory/selectors';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { StatTotalToggle } from 'app/dim-ui/CustomStatTotal';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { dimHunterIcon, dimWarlockIcon, dimTitanIcon } from 'app/shell/icons/custom';
import { DimStore } from 'app/inventory/store-types';

const classIcons = {
  [DestinyClass.Hunter]: dimHunterIcon,
  [DestinyClass.Titan]: dimTitanIcon,
  [DestinyClass.Warlock]: dimWarlockIcon,
};

interface StoreProps {
  settings: Settings;
  isPhonePortrait: boolean;
  storesLoaded: boolean;
  stores: DimStore[];
  reviewModeOptions: D2ReviewMode[];
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    settings: settingsSelector(state),
    storesLoaded: storesLoadedSelector(state),
    stores: sortedStoresSelector(state),
    isPhonePortrait: state.shell.isPhonePortrait,
    reviewModeOptions: $featureFlags.reviewsEnabled ? reviewModesSelector(state) : emptyArray(),
  };
}

type Props = StoreProps & ThunkDispatchProp;

const fakeWeapon = {
  icon: `~${exampleWeaponImage}`,
  dtrRating: 4.9,
  dtrRatingCount: 100,
  element: {
    displayProperties: {
      icon: '/img/destiny_content/damage_types/destiny2/thermal.png',
    },
  },
  isNew: true,
  location: {
    type: 'energy',
  },
  bucket: {
    type: 'energy',
  },
  visible: true,
  primStat: {
    value: 300,
  },
  isDestiny2() {
    return true;
  },
  isDestiny1() {
    return false;
  },
};

const fakeArmor = {
  icon: `~${exampleArmorImage}`,
  quality: {
    min: 96,
  },
  isNew: true,
  location: {
    type: 'energy',
  },
  bucket: {
    type: 'energy',
  },
  visible: true,
  primStat: {
    value: 300,
  },
  isDestiny2() {
    return false;
  },
  isDestiny1() {
    return true;
  },
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
  'zh-chs': '简体中文', // Chinese (Simplified)
});

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
      'Achromatomaly',
    ])
  : [];

// Edge doesn't support these
const supportsCssVar = window?.CSS?.supports('(--foo: red)');

function SettingsPage({
  settings,
  isPhonePortrait,
  reviewModeOptions,
  storesLoaded,
  stores,
  dispatch,
}: Props) {
  useEffect(() => {
    dispatch(getDefinitions());
    dispatch(getPlatforms()).then(() => {
      const account = getActivePlatform();
      if (account) {
        account.destinyVersion === 2
          ? D2StoresService.getStoresStream(account)
          : D1StoresService.getStoresStream(account);
      }
    });
  }, [dispatch]);

  const [languageChanged, setLanguageChanged] = useState(false);

  const onChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
    if (e.target.name.length === 0) {
      console.error(new Error('You need to have a name on the form input'));
    }

    if (isInputElement(e.target) && e.target.type === 'checkbox') {
      dispatch(setSetting(e.target.name as any, e.target.checked));
    } else {
      dispatch(setSetting(e.target.name as any, e.target.value));
    }
  };

  const changeLanguage = (e) => {
    const language = e.target.value;
    localStorage.setItem('dimLanguage', language);
    i18next.changeLanguage(language, () => {
      dispatch(setSetting('language', language));
    });
    setLanguageChanged(true);
  };

  const resetItemSize = (e) => {
    e.preventDefault();
    dispatch(setSetting('itemSize', 50));
    return false;
  };

  const saveAndReloadReviews = (e) => {
    e.preventDefault();
    onChange(e);

    if ($featureFlags.reviewsEnabled) {
      dispatch(clearRatings());
      dispatch(fetchRatings());
    }

    return false;
  };

  const reloadDim = (e) => {
    e.preventDefault();
    window.location.reload(false);
    return false;
  };

  const itemSortOrderChanged = (sortOrder: SortProperty[]) => {
    dispatch(setSetting('itemSort', 'custom'));
    dispatch(
      setSetting(
        'itemSortOrderCustom',
        sortOrder.filter((o) => o.enabled).map((o) => o.id)
      )
    );
  };

  const characterSortOrderChanged = (order: string[]) => {
    dispatch(setCharacterOrder(order));
  };

  const tagLabelList = itemTagList.map((tagLabel) => t(tagLabel.label));
  const listSeparator = ['ja', 'zh-cht', 'zh-chs'].includes(settings.language) ? '、' : ', ';
  const tagListString = tagLabelList.join(listSeparator);
  const itemSortProperties = {
    typeName: t('Settings.SortByType'),
    rarity: t('Settings.SortByRarity'),
    primStat: t('Settings.SortByPrimary'),
    amount: t('Settings.SortByAmount'),
    rating: t('Settings.SortByRating'),
    classType: t('Settings.SortByClassType'),
    name: t('Settings.SortName'),
    tag: t('Settings.SortByTag', { taglist: tagListString }),
    // archetype: 'Archetype'
  };

  const charColOptions = _.range(3, 6).map((num) => ({
    value: num,
    name: t('Settings.ColumnSize', { num }),
  }));
  const vaultColOptions = _.range(5, 21).map((num) => ({
    value: num,
    name: t('Settings.ColumnSize', { num }),
  }));
  vaultColOptions.unshift({ value: 999, name: t('Settings.ColumnSizeAuto') });

  const sortOrder = itemSortOrder(settings);

  const itemSortCustom = _.sortBy(
    _.map(
      itemSortProperties,
      (displayName, id): SortProperty => ({
        id,
        displayName,
        enabled: sortOrder.includes(id),
      })
    ),
    (o) => {
      const index = sortOrder.indexOf(o.id);
      return index >= 0 ? index : 999;
    }
  );

  const menuItems = _.compact([
    { id: 'general', title: t('Settings.General') },
    { id: 'items', title: t('Settings.Items') },
    { id: 'inventory', title: t('Settings.Inventory') },
    $featureFlags.wishLists ? { id: 'wishlist', title: t('WishListRoll.Header') } : undefined,
    { id: 'ratings', title: t('Settings.Ratings') },
    { id: 'storage', title: t('Storage.MenuTitle') },
    { id: 'spreadsheets', title: t('Settings.Data') },
  ]);

  if (!storesLoaded) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  const uniqChars = _.uniqBy(
    stores.filter((s) => !s.isVault),
    (s) => s.classType
  );

  return (
    <PageWithMenu>
      <PageWithMenu.Menu>
        {!isPhonePortrait &&
          menuItems.map((menuItem) => (
            <PageWithMenu.MenuButton key={menuItem.id} anchor={menuItem.id}>
              <span>{menuItem.title}</span>
            </PageWithMenu.MenuButton>
          ))}
      </PageWithMenu.Menu>
      <PageWithMenu.Contents className="settings">
        <h1>{t('Settings.Settings')}</h1>
        <form>
          <section id="general">
            <h2>{t('Settings.General')}</h2>
            <div className="setting">
              <Select
                label={t('Settings.Language')}
                name="language"
                value={settings.language}
                options={languageOptions}
                onChange={changeLanguage}
              />
              {languageChanged && (
                <div>
                  <button type="button" className="dim-button" onClick={reloadDim}>
                    <AppIcon icon={refreshIcon} /> <span>{t('Settings.ReloadDIM')}</span>
                  </button>
                </div>
              )}
            </div>

            <Select
              label={t('Settings.ColorA11y')}
              name="colorA11y"
              value={settings.colorA11y}
              options={colorA11yOptions}
              onChange={onChange}
            />
          </section>

          <section id="items">
            <h2>{t('Settings.Items')}</h2>
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
                    onChange={onChange}
                  />
                  {Math.max(48, settings.itemSize)}px
                  <button type="button" className="dim-button" onClick={resetItemSize}>
                    {t('Settings.ResetToDefault')}
                  </button>
                </div>
                <div className="fineprint">{t('Settings.DefaultItemSizeNote')}</div>
              </div>
            )}

            <Checkbox
              label={t('Settings.ShowNewItems')}
              name="showNewItems"
              value={settings.showNewItems}
              onChange={onChange}
            />

            <div className="setting">
              <label htmlFor="itemSort">{t('Settings.SetSort')}</label>

              <SortOrderEditor order={itemSortCustom} onSortOrderChanged={itemSortOrderChanged} />
              <div className="fineprint">{t('Settings.DontForgetDupes')}</div>
            </div>
            <div className="setting">
              <label htmlFor="">{t('Organizer.Columns.CustomTotal')}</label>
              <div className="fineprint">{t('Settings.CustomStatDesc')}</div>
              <div className="customStats">
                {uniqChars.map(
                  (store) =>
                    !store.isVault && (
                      <React.Fragment key={store.classType}>
                        <div>
                          <AppIcon icon={classIcons[store.classType]} /> {store.className}:{' '}
                        </div>
                        <StatTotalToggle forClass={store.classType} />
                      </React.Fragment>
                    )
                )}
              </div>
            </div>
          </section>

          <section id="inventory">
            <h2>{t('Settings.Inventory')}</h2>
            <div className="setting">
              <label>{t('Settings.CharacterOrder')}</label>
              <div className="radioOptions">
                <label>
                  <input
                    type="radio"
                    name="characterOrder"
                    checked={settings.characterOrder === 'mostRecent'}
                    value="mostRecent"
                    onChange={onChange}
                  />
                  <span>{t('Settings.CharacterOrderRecent')}</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="characterOrder"
                    checked={settings.characterOrder === 'mostRecentReverse'}
                    value="mostRecentReverse"
                    onChange={onChange}
                  />
                  <span>{t('Settings.CharacterOrderReversed')}</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="characterOrder"
                    checked={settings.characterOrder === 'fixed'}
                    value="fixed"
                    onChange={onChange}
                  />
                  <span>{t('Settings.CharacterOrderFixed')}</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="characterOrder"
                    checked={settings.characterOrder === 'custom'}
                    value="custom"
                    onChange={onChange}
                  />
                  <span>{t('Settings.SortCustom')}</span>
                </label>
                {settings.characterOrder === 'custom' && (
                  <CharacterOrderEditor onSortOrderChanged={characterSortOrderChanged} />
                )}
              </div>
            </div>

            {supportsCssVar &&
              (isPhonePortrait ? (
                <div className="setting">
                  <Select
                    label={t('Settings.InventoryColumnsMobile')}
                    name="charColMobile"
                    value={settings.charColMobile}
                    options={charColOptions}
                    onChange={onChange}
                  />
                  <div className="fineprint">{t('Settings.InventoryColumnsMobileLine2')}</div>
                </div>
              ) : (
                <Select
                  label={t('Settings.InventoryColumns')}
                  name="charCol"
                  value={settings.charCol}
                  options={charColOptions}
                  onChange={onChange}
                />
              ))}
          </section>

          {$featureFlags.wishLists && <WishListSettings />}

          <section id="ratings">
            <h2>{t('Settings.Ratings')}</h2>
            <div className="examples sub-bucket">
              <InventoryItem item={(fakeWeapon as any) as DimItem} rating={4.9} isNew={true} />
              <InventoryItem item={(fakeArmor as any) as DimItem} isNew={true} />
            </div>

            <Checkbox
              label={t('Settings.EnableAdvancedStats')}
              name="itemQuality"
              value={settings.itemQuality}
              onChange={onChange}
            />

            {$featureFlags.reviewsEnabled && (
              <>
                <div className="setting">
                  <Checkbox
                    label={t('Settings.ShowReviews')}
                    name="showReviews"
                    helpLink="https://github.com/DestinyItemManager/DIM/blob/master/docs/RATINGS.md"
                    value={settings.showReviews}
                    onChange={onChange}
                  />
                  <RatingsKey />
                </div>
                <div className="setting">
                  <Checkbox
                    label={t('Settings.AllowIdPostToDtr')}
                    name="allowIdPostToDtr"
                    helpLink="https://github.com/DestinyItemManager/DIM/blob/master/docs/PRIVACY.md"
                    value={settings.allowIdPostToDtr}
                    onChange={onChange}
                  />
                  <div className="fineprint">{t('Settings.AllowIdPostToDtrLine2')}</div>
                </div>

                {settings.allowIdPostToDtr && (
                  <>
                    <Select
                      label={t('Settings.ReviewsPlatformSelection')}
                      name="reviewsPlatformSelectionV2"
                      value={settings.reviewsPlatformSelectionV2}
                      options={reviewPlatformOptions.map((o) => ({
                        name: t(o.description),
                        value: o.platform,
                      }))}
                      onChange={saveAndReloadReviews}
                    />

                    <Select
                      label={t('Settings.ReviewsModeSelection')}
                      name="reviewsModeSelection"
                      value={settings.reviewsModeSelection}
                      options={reviewModeOptions.map((m) => ({
                        name: m.description,
                        value: m.mode,
                      }))}
                      onChange={saveAndReloadReviews}
                    />
                  </>
                )}
              </>
            )}
          </section>

          <ErrorBoundary name="StorageSettings">
            <DimApiSettings />
          </ErrorBoundary>

          <Spreadsheets />
        </form>
      </PageWithMenu.Contents>
    </PageWithMenu>
  );
}

export default connect<StoreProps>(mapStateToProps)(SettingsPage);

function isInputElement(element: HTMLElement): element is HTMLInputElement {
  return element.nodeName === 'INPUT';
}
