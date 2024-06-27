import { LoadoutSort } from '@destinyitemmanager/dim-api-types';
import { currentAccountSelector, hasD1AccountSelector } from 'app/accounts/selectors';
import { clarityDiscordLink, clarityLink } from 'app/clarity/about';
import { settingsSelector } from 'app/dim-api/selectors';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import { t } from 'app/i18next-t';
import NewItemIndicator from 'app/inventory/NewItemIndicator';
import TagIcon from 'app/inventory/TagIcon';
import { clearAllNewItems } from 'app/inventory/actions';
import { itemTagList } from 'app/inventory/dim-item-info';
import { allItemsSelector } from 'app/inventory/selectors';
import { useLoadStores } from 'app/inventory/store/hooks';
import WishListSettings from 'app/settings/WishListSettings';
import { useIsPhonePortrait } from 'app/shell/selectors';
import DimApiSettings from 'app/storage/DimApiSettings';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import StreamDeckSettings from 'app/stream-deck/StreamDeckSettings/StreamDeckSettings';
import { clearAppBadge } from 'app/utils/app-badge';
import { usePageTitle } from 'app/utils/hooks';
import { errorLog } from 'app/utils/log';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import ErrorBoundary from '../dim-ui/ErrorBoundary';
import InventoryItem from '../inventory/InventoryItem';
import { AppIcon, faGrid, faList, lockIcon, unlockedIcon } from '../shell/icons';
import CharacterOrderEditor from './CharacterOrderEditor';
import Checkbox from './Checkbox';
import { CustomStatsSettings } from './CustomStatsSettings';
import LanguageSetting from './LanguageSetting';
import Select, { mapToOptions } from './Select';
import styles from './SettingsPage.m.scss';
import SortOrderEditor, { SortProperty } from './SortOrderEditor';
import Spreadsheets from './Spreadsheets';
import { TroubleshootingSettings } from './Troubleshooting';
import { setCharacterOrder } from './actions';
import { useSetSetting } from './hooks';
import { Settings, VaultWeaponGroupingStyle } from './initial-settings';
import { itemSortSettingsSelector } from './item-sort';

const TAG = 'settings';

export const settingClass = styles.setting;
export const fineprintClass = styles.fineprint;
export const horizontalClass = styles.horizontal;

const themeOptions = mapToOptions({
  default: 'Default (Beyond Light)',
  classic: 'DIM Classic',
  dimdark: 'DIM Dark Mode',
  europa: 'Europa',
  neomuna: 'Neomuna',
  pyramid: 'Pyramid Fleet',
  throneworld: 'Throne World',
  vexnet: 'Vex Network',
});

export default function SettingsPage() {
  usePageTitle(t('Settings.Settings'));
  const dispatch = useThunkDispatch();
  const settings = useSelector(settingsSelector);
  const currentAccount = useSelector(currentAccountSelector);
  const hasD1Account = useSelector(hasD1AccountSelector);
  const isPhonePortrait = useIsPhonePortrait();
  useLoadStores(currentAccount);
  const setSetting = useSetSetting();
  const allItems = useSelector(allItemsSelector);

  const exampleWeapon = allItems.find(
    (i) => i.bucket.sort === 'Weapons' && !i.isExotic && !i.masterwork && !i.deepsightInfo,
  );
  // Include a masterworked item because they look different in some themes
  const exampleWeaponMasterworked = allItems.find(
    (i) => i.bucket.sort === 'Weapons' && !i.isExotic && i.masterwork && !i.deepsightInfo,
  );
  const exampleArmor = allItems.find((i) => i.bucket.sort === 'Armor' && !i.isExotic);

  const onCheckChange = (checked: boolean, name: keyof Settings) => {
    if (name.length === 0) {
      errorLog(TAG, new Error('You need to have a name on the form input'));
    }

    setSetting(name, checked);
  };
  const onChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
    if (e.target.name.length === 0) {
      errorLog(TAG, new Error('You need to have a name on the form input'));
    }

    if (isInputElement(e.target) && e.target.type === 'checkbox') {
      setSetting(e.target.name as keyof Settings, e.target.checked);
    } else {
      setSetting(e.target.name as keyof Settings, e.target.value);
    }
  };

  const onChangeNumeric: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
    if (e.target.name.length === 0) {
      errorLog(TAG, new Error('You need to have a name on the form input'));
    }

    setSetting(e.target.name as keyof Settings, parseInt(e.target.value, 10));
  };

  const onChangePerkList: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setSetting('perkList', e.target.value === 'true');
  };

  const onBadgePostmasterChanged = (checked: boolean, name: keyof Settings) => {
    if (!checked) {
      clearAppBadge();
    }
    onCheckChange(checked, name);
  };

  const changeTheme = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const theme = e.target.value;
    setSetting('theme', theme);
  };

  const changeDescriptionDisplay = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSetting('descriptionsToDisplay', e.target.value);
  };

  const resetItemSize = (e: React.MouseEvent) => {
    e.preventDefault();
    setSetting('itemSize', 50);
    return false;
  };

  const changeVaultWeaponGrouping = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vaultWeaponGrouping = e.target.value;
    setSetting('vaultWeaponGrouping', vaultWeaponGrouping);
  };

  const itemSortOrderChanged = (sortOrder: SortProperty[]) => {
    setSetting(
      'itemSortOrderCustom',
      sortOrder.filter((o) => o.enabled).map((o) => o.id),
    );
    setSetting(
      'itemSortReversals',
      sortOrder.filter((o) => o.reversed).map((o) => o.id),
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
    acquisitionRecency: t('Settings.SortByRecent'),
    elementWeapon: t('Settings.SortByWeaponElement'),
    masterworked: t('Settings.Masterworked'),
    crafted: t('Settings.SortByCrafted'),
    deepsight: t('Settings.SortByDeepsight'),
    // archetype: 'Archetype'
  };

  const vaultWeaponGroupingOptions = mapToOptions({
    '': t('Settings.VaultGroupingNone'),
    typeName: t('Settings.SortByType'),
    rarity: t('Settings.SortByRarity'),
    ammoType: t('Settings.SortByAmmoType'),
    tag: t('Settings.SortByTag', { taglist: tagListString }),
    elementWeapon: t('Settings.SortByWeaponElement'),
  });

  const descriptionDisplayOptions = mapToOptions({
    both: t('Settings.BothDescriptions'),
    bungie: t('Settings.BungieDescriptionOnly'),
    community: t('Settings.CommunityDescriptionOnly'),
  });

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

  const sortSettings = useSelector(itemSortSettingsSelector);

  const itemSortCustom = _.sortBy(
    Object.entries(itemSortProperties).map(
      ([id, displayName]): SortProperty => ({
        id,
        displayName,
        enabled: sortSettings.sortOrder.includes(id),
        reversed: sortSettings.sortReversals.includes(id),
      }),
    ),
    (o) => {
      const index = sortSettings.sortOrder.indexOf(o.id);
      return index >= 0 ? index : 999;
    },
  );

  const menuItems = _.compact([
    { id: 'general', title: t('Settings.Language') },
    { id: 'theme', title: t('Settings.Theme') },
    { id: 'items', title: t('Settings.Items') },
    { id: 'inventory', title: t('Settings.Inventory') },
    $featureFlags.wishLists ? { id: 'wishlist', title: t('WishListRoll.Header') } : undefined,
    { id: 'storage', title: t('Storage.MenuTitle') },
    { id: 'spreadsheets', title: t('Settings.Data') },
    $featureFlags.elgatoStreamDeck && !isPhonePortrait
      ? { id: 'stream-deck', title: 'Elgato Stream Deck' }
      : undefined,
  ]);

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
      <PageWithMenu.Contents className={styles.settings}>
        <h1>{t('Settings.Settings')}</h1>
        <form>
          <section id="general">
            <h2>{t('Settings.Language')}</h2>
            <div className={styles.setting}>
              <LanguageSetting />
            </div>
          </section>

          <section id="theme">
            <h2>{t('Settings.Theme')}</h2>
            <div className={styles.setting}>
              <Select
                label={t('Settings.Theme')}
                name="theme"
                value={settings.theme}
                options={themeOptions}
                onChange={changeTheme}
              />
            </div>
          </section>

          <section id="items">
            <h2>{t('Settings.Items')}</h2>

            <div className="sub-bucket">
              {exampleWeapon && (
                <InventoryItem
                  item={exampleWeapon}
                  isNew={settings.showNewItems}
                  tag="favorite"
                  autoLockTagged={settings.autoLockTagged}
                />
              )}
              {exampleWeaponMasterworked && (
                <InventoryItem
                  item={exampleWeaponMasterworked}
                  isNew={settings.showNewItems}
                  tag="keep"
                  autoLockTagged={settings.autoLockTagged}
                />
              )}
              {exampleArmor && (
                <InventoryItem
                  item={exampleArmor}
                  isNew={settings.showNewItems}
                  tag="keep"
                  autoLockTagged={settings.autoLockTagged}
                />
              )}
            </div>

            {!isPhonePortrait && (
              <div className={styles.setting}>
                <div className={styles.itemSize}>
                  <label htmlFor="itemSize">{t('Settings.SizeItem')}</label>
                  <input
                    value={settings.itemSize}
                    type="range"
                    min="48"
                    max="66"
                    name="itemSize"
                    onChange={onChangeNumeric}
                  />
                  {Math.max(48, settings.itemSize)}px
                  <button type="button" className="dim-button" onClick={resetItemSize}>
                    {t('Settings.ResetToDefault')}
                  </button>
                </div>
                <div className={styles.fineprint}>{t('Settings.DefaultItemSizeNote')}</div>
              </div>
            )}
            <div className={styles.setting}>
              <Checkbox
                label={t('Settings.ShowNewItems')}
                name="showNewItems"
                value={settings.showNewItems}
                onChange={onCheckChange}
              />
              <button
                type="button"
                className="dim-button"
                onClick={() => dispatch(clearAllNewItems())}
              >
                <NewItemIndicator className={styles.newItem} />{' '}
                <span>{t('Hotkey.ClearNewItems')}</span>
              </button>
            </div>

            <div className={styles.setting}>
              <Select
                label={t('Settings.SetVaultWeaponGrouping')}
                name="vaultWeaponGrouping"
                value={settings.vaultWeaponGrouping}
                options={vaultWeaponGroupingOptions}
                onChange={changeVaultWeaponGrouping}
              />
              {settings.vaultWeaponGrouping && (
                <Checkbox
                  label={t('Settings.VaultWeaponGroupingStyle')}
                  name="vaultWeaponGroupingStyle"
                  value={settings.vaultWeaponGroupingStyle !== VaultWeaponGroupingStyle.Inline}
                  onChange={(checked, setting) =>
                    setSetting(
                      setting,
                      checked ? VaultWeaponGroupingStyle.Lines : VaultWeaponGroupingStyle.Inline,
                    )
                  }
                />
              )}
            </div>

            <div className={styles.setting}>
              <label htmlFor="itemSort">{t('Settings.SetSort')}</label>

              <SortOrderEditor order={itemSortCustom} onSortOrderChanged={itemSortOrderChanged} />
              <div className={styles.fineprint}>{t('Settings.DontForgetDupes')}</div>
            </div>

            <div className={styles.setting}>
              <CustomStatsSettings />
            </div>

            <div className={styles.setting}>
              {t('Settings.PerkDisplay')}
              <ul className={styles.radioOptions}>
                <li>
                  <label>
                    <input
                      type="radio"
                      name="perkDisplay"
                      checked={settings.perkList}
                      value="true"
                      onChange={onChangePerkList}
                    />
                    <AppIcon icon={faList} /> {t('Settings.PerkList')}
                  </label>
                </li>
                <li>
                  <label>
                    <input
                      type="radio"
                      name="perkDisplay"
                      checked={!settings.perkList}
                      value="false"
                      onChange={onChangePerkList}
                    />
                    <AppIcon icon={faGrid} /> {t('Settings.PerkGrid')}
                  </label>
                </li>
              </ul>
            </div>
            {$featureFlags.clarityDescriptions && (
              <div className={styles.setting}>
                <Select
                  label={t('Settings.CommunityData')}
                  name="descriptionsToDisplay"
                  value={settings.descriptionsToDisplay}
                  options={descriptionDisplayOptions}
                  onChange={changeDescriptionDisplay}
                />
                <div
                  className={styles.fineprint}
                  dangerouslySetInnerHTML={{
                    __html: t('Views.About.CommunityInsight', {
                      clarityLink,
                      clarityDiscordLink,
                    }),
                  }}
                />
              </div>
            )}
            {hasD1Account && (
              <div className={styles.setting}>
                <Checkbox
                  label={t('Settings.EnableAdvancedStats')}
                  name="itemQuality"
                  value={settings.itemQuality}
                  onChange={onCheckChange}
                />
              </div>
            )}
            <div className={styles.setting}>
              <Checkbox
                label={t('Settings.AutoLockTagged')}
                name="autoLockTagged"
                value={settings.autoLockTagged}
                onChange={onCheckChange}
              />
              <div className={styles.fineprint}>{t('Settings.AutoLockTaggedExplanation')}</div>
              <table className={styles.autoTagTable}>
                <tbody>
                  <tr>
                    <td>
                      <TagIcon tag="favorite" />
                      <TagIcon tag="keep" />
                      <TagIcon tag="archive" />
                    </td>
                    <td>→</td>
                    <td>
                      <AppIcon icon={lockIcon} />
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <TagIcon tag="junk" />
                      <TagIcon tag="infuse" />
                    </td>
                    <td>→</td>
                    <td>
                      <AppIcon icon={unlockedIcon} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="inventory">
            <h2>{t('Settings.Inventory')}</h2>
            <div className={styles.setting}>
              <Checkbox
                label={t('Settings.SingleCharacter')}
                name="singleCharacter"
                value={settings.singleCharacter}
                onChange={onCheckChange}
              />
              <div className={styles.fineprint}>{t('Settings.SingleCharacterExplanation')}</div>
            </div>
            {!settings.singleCharacter && (
              <div className={styles.setting}>
                <label>{t('Settings.CharacterOrder')}</label>
                <ul className={styles.radioOptions}>
                  <li>
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
                  </li>
                  <li>
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
                  </li>
                  <li>
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
                  </li>
                  <li>
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
                  </li>
                  {settings.characterOrder === 'custom' && (
                    <CharacterOrderEditor onSortOrderChanged={characterSortOrderChanged} />
                  )}
                </ul>
              </div>
            )}

            <div className={styles.setting}>
              {isPhonePortrait ? (
                <>
                  <Select
                    label={t('Settings.InventoryColumnsMobile')}
                    name="charColMobile"
                    value={settings.charColMobile}
                    options={charColOptions}
                    onChange={onChangeNumeric}
                  />
                  <div className={styles.fineprint}>
                    {t('Settings.InventoryColumnsMobileLine2')}
                  </div>
                </>
              ) : (
                <Select
                  label={t('Settings.InventoryColumns')}
                  name="charCol"
                  value={settings.charCol}
                  options={charColOptions}
                  onChange={onChangeNumeric}
                />
              )}
            </div>
            <div className={styles.setting}>
              <Checkbox
                label={t('Settings.HidePullFromPostmaster')}
                name="hidePullFromPostmaster"
                value={settings.hidePullFromPostmaster}
                onChange={onCheckChange}
              />
            </div>
            <div className={styles.setting}>
              <Checkbox
                label={t('Settings.BadgePostmaster')}
                name="badgePostmaster"
                value={settings.badgePostmaster}
                onChange={onBadgePostmasterChanged}
              />
              <div className={styles.fineprint}>{t('Settings.BadgePostmasterExplanation')}</div>
            </div>
            <div className={styles.setting}>
              <Select
                label={t('Settings.InventoryNumberOfSpacesToClear')}
                name="inventoryClearSpaces"
                value={settings.inventoryClearSpaces}
                options={numberOfSpacesOptions}
                onChange={onChangeNumeric}
              />
            </div>
            <div className={styles.setting}>
              <label>{t('Settings.LoadoutSort')}</label>
              <div className={styles.radioOptions}>
                <label>
                  <input
                    type="radio"
                    name="loadoutSort"
                    checked={settings.loadoutSort === LoadoutSort.ByEditTime}
                    value={LoadoutSort.ByEditTime}
                    onChange={onChangeNumeric}
                  />
                  <span>{t('Loadouts.SortByEditTime')}</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="loadoutSort"
                    checked={settings.loadoutSort === LoadoutSort.ByName}
                    value={LoadoutSort.ByName}
                    onChange={onChangeNumeric}
                  />
                  <span>{t('Loadouts.SortByName')}</span>
                </label>
              </div>
            </div>
          </section>

          {$featureFlags.wishLists && <WishListSettings />}

          <ErrorBoundary name="StorageSettings">
            <DimApiSettings />
          </ErrorBoundary>

          <Spreadsheets />

          {$featureFlags.elgatoStreamDeck && !isPhonePortrait && <StreamDeckSettings />}

          {$DIM_FLAVOR !== 'release' && currentAccount?.destinyVersion === 2 && (
            <div className={styles.setting}>
              <TroubleshootingSettings />
            </div>
          )}
        </form>
      </PageWithMenu.Contents>
    </PageWithMenu>
  );
}

function isInputElement(element: HTMLElement): element is HTMLInputElement {
  return element.nodeName === 'INPUT';
}
