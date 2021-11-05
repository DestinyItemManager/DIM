import { DestinyAccount } from 'app/accounts/destiny-account';
import { currentAccountSelector } from 'app/accounts/selectors';
import { settingsSelector } from 'app/dim-api/selectors';
import ClassIcon from 'app/dim-ui/ClassIcon';
import { StatTotalToggle } from 'app/dim-ui/CustomStatTotal';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import { t } from 'app/i18next-t';
import { clearAllNewItems } from 'app/inventory/actions';
import { itemTagList } from 'app/inventory/dim-item-info';
import NewItemIndicator from 'app/inventory/NewItemIndicator';
import { sortedStoresSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { useLoadStores } from 'app/inventory/store/hooks';
import WishListSettings from 'app/settings/WishListSettings';
import { useIsPhonePortrait } from 'app/shell/selectors';
import DimApiSettings from 'app/storage/DimApiSettings';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { errorLog } from 'app/utils/log';
import i18next from 'i18next';
import exampleArmorImage from 'images/example-armor.jpg';
import exampleWeaponImage from 'images/example-weapon.jpg';
import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import InventoryItem from '../inventory/InventoryItem';
import { DimItem } from '../inventory/item-types';
import { AppIcon, refreshIcon } from '../shell/icons';
import { setCharacterOrder } from './actions';
import CharacterOrderEditor from './CharacterOrderEditor';
import Checkbox from './Checkbox';
import { useSetSetting } from './hooks';
import { Settings } from './initial-settings';
import { itemSortOrder } from './item-sort';
import Select, { mapToOptions } from './Select';
import './settings.scss';
import SortOrderEditor, { SortProperty } from './SortOrderEditor';
import Spreadsheets from './Spreadsheets';

interface StoreProps {
  currentAccount?: DestinyAccount;
  settings: Settings;
  stores: DimStore[];
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    settings: settingsSelector(state),
    stores: sortedStoresSelector(state),
    currentAccount: currentAccountSelector(state),
  };
}

type Props = StoreProps & ThunkDispatchProp;

const fakeWeapon = {
  icon: `~${exampleWeaponImage}`,
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
  primaryStat: {
    value: 300,
  },
  itemCategoryHashes: [],
  destinyVersion: 2,
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
  itemCategoryHashes: [],
  destinyVersion: 1,
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

// This state is outside the settings page because the settings loses its
let languageChanged = false;

function SettingsPage({ settings, stores, currentAccount, dispatch }: Props) {
  const isPhonePortrait = useIsPhonePortrait();
  useLoadStores(currentAccount);
  const setSetting = useSetSetting();
  const onCheckChange = (checked: boolean, name: keyof Settings) => {
    if (name.length === 0) {
      errorLog('settings', new Error('You need to have a name on the form input'));
    }

    setSetting(name, checked);
  };
  const onChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
    if (e.target.name.length === 0) {
      errorLog('settings', new Error('You need to have a name on the form input'));
    }

    if (isInputElement(e.target) && e.target.type === 'checkbox') {
      setSetting(e.target.name as keyof Settings, e.target.checked);
    } else {
      setSetting(e.target.name as keyof Settings, e.target.value);
    }
  };

  const onBadgePostmasterChanged = (checked: boolean, name: keyof Settings) => {
    if (!checked && 'setAppBadge' in navigator) {
      navigator.clearAppBadge();
    }
    onCheckChange(checked, name);
  };

  const changeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    languageChanged = true;
    const language = e.target.value;
    localStorage.setItem('dimLanguage', language);
    i18next.changeLanguage(language, () => {
      setSetting('language', language);
    });
  };

  const resetItemSize = (e: React.MouseEvent) => {
    e.preventDefault();
    setSetting('itemSize', 50);
    return false;
  };

  const reloadDim = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.reload();
    return false;
  };

  const itemSortOrderChanged = (sortOrder: SortProperty[]) => {
    setSetting(
      'itemSortOrderCustom',
      sortOrder.filter((o) => o.enabled).map((o) => o.id)
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
    ammoType: t('Settings.SortByAmmoType'),
    name: t('Settings.SortName'),
    tag: t('Settings.SortByTag', { taglist: tagListString }),
    season: t('Settings.SortBySeason'),
    sunset: t('Settings.SortBySunset'),
    acquisitionRecency: t('Settings.SortByRecent'),
    masterworked: t('Settings.Masterworked'),
    // archetype: 'Archetype'
  };

  const charColOptions = _.range(2, 6).map((num) => ({
    value: num,
    name: t('Settings.ColumnSize', { num }),
  }));
  const numberOfSpacesOptions = _.range(1, 10).map((count) => ({
    value: count,
    name: t('Settings.SpacesSize', { count }),
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

  const uniqChars =
    stores &&
    _.uniqBy(
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
          </section>

          <section id="items">
            <h2>{t('Settings.Items')}</h2>
            <div className="examples">
              <InventoryItem item={fakeWeapon as unknown as DimItem} isNew={true} tag="favorite" />
            </div>

            {!isPhonePortrait && (
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
            <div className="setting">
              <Checkbox
                label={t('Settings.ShowNewItems')}
                name="showNewItems"
                value={settings.showNewItems}
                onChange={onCheckChange}
              />
              <div className="subSetting">
                <button
                  type="button"
                  className="dim-button"
                  onClick={() => dispatch(clearAllNewItems())}
                >
                  <NewItemIndicator className="new-item" alwaysShow />{' '}
                  <span>{t('Hotkey.ClearNewItems')}</span>
                </button>
              </div>
            </div>

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
                          <ClassIcon classType={store.classType} /> {store.className}:{' '}
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
              <Checkbox
                label={t('Settings.SingleCharacter')}
                name="singleCharacter"
                value={settings.singleCharacter}
                onChange={onCheckChange}
              />
              <div className="fineprint">{t('Settings.SingleCharacterExplanation')}</div>
            </div>
            {!settings.singleCharacter && (
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
            )}

            {isPhonePortrait ? (
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
            )}
            <div className="setting">
              <Checkbox
                label={t('Settings.BadgePostmaster')}
                name="badgePostmaster"
                value={settings.badgePostmaster}
                onChange={onBadgePostmasterChanged}
              />
              <div className="fineprint">{t('Settings.BadgePostmasterExplanation')}</div>
            </div>
            <Select
              label={t('Settings.InventoryNumberOfSpacesToClear')}
              name="inventoryClearSpaces"
              value={settings.inventoryClearSpaces}
              options={numberOfSpacesOptions}
              onChange={onChange}
            />
          </section>

          {$featureFlags.wishLists && <WishListSettings />}

          <section id="ratings">
            <h2>{t('Settings.Ratings')}</h2>
            <div className="examples sub-bucket">
              <InventoryItem item={fakeWeapon as unknown as DimItem} isNew={true} />
              <InventoryItem item={fakeArmor as unknown as DimItem} isNew={true} />
            </div>

            <Checkbox
              label={t('Settings.EnableAdvancedStats')}
              name="itemQuality"
              value={settings.itemQuality}
              onChange={onCheckChange}
            />
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
