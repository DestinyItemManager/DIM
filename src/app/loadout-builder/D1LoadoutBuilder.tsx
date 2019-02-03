import * as React from 'react';
import CharacterSelect from '../character-select/CharacterSelect';
import './loadout-builder.scss';
import { D1Item, D1GridNode, DimItem } from '../inventory/item-types';
import {
  ArmorTypes,
  LockedPerkHash,
  ClassTypes,
  SetType,
  ItemBucket,
  PerkCombination,
  D1ItemWithNormalStats
} from './types';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { D1Store } from '../inventory/store-types';
import { RootState } from '../store/reducers';
import { storesSelector } from '../inventory/reducer';
import { currentAccountSelector } from '../accounts/reducer';
import { D1StoresService } from '../inventory/d1-stores.service';
import { Loading } from '../dim-ui/Loading';
import CollapsibleTitle from '../dim-ui/CollapsibleTitle';
import { t } from 'i18next';
import LoadoutDrawer from '../loadout/LoadoutDrawer';
import { getDefinitions, D1ManifestDefinitions } from '../destiny1/d1-definitions.service';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import { getColor } from '../shell/dimAngularFilters.filter';
import { loadBucket, getActiveBuckets, filterLoadoutToEquipped } from './utils';
import LoadoutBuilderItem from './LoadoutBuilderItem';
import { getSetBucketsStep } from './calculate';
import { refreshIcon, AppIcon, expandIcon, collapseIcon } from '../shell/icons';
import CharacterStats from '../inventory/CharacterStats';
import ItemTalentGrid from '../item-popup/ItemTalentGrid';
import LoadoutBuilderLocks from './LoadoutBuilderLocks';
import { produce } from 'immer';

interface StoreProps {
  account: DestinyAccount;
  stores: D1Store[];
  buckets?: InventoryBuckets;
}

type Props = StoreProps;

function mapStateToProps(state: RootState): StoreProps {
  return {
    account: currentAccountSelector(state)!,
    buckets: state.inventory.buckets,
    stores: storesSelector(state) as D1Store[]
  };
}

interface State {
  defs?: D1ManifestDefinitions;
  selectedCharacter?: D1Store;
  excludeditems: D1Item[];
  lockedperks: { [armorType in ArmorTypes]: LockedPerkHash };
  active: ClassTypes;
  activesets: string;
  type: ArmorTypes;
  scaleType: 'base' | 'scaled';
  progress: number;
  fullMode: boolean;
  includeVendors: boolean;
  showBlues: boolean;
  showExotics: boolean;
  showYear1: boolean;
  showHelp: boolean;
  showAdvanced: boolean;
  allSetTiers: string[];
  hasSets: boolean;
  highestsets: { [setHash: number]: SetType };
  activeHighestSets: { [setHash: number]: SetType };
  ranked: ItemBucket;
  activePerks: PerkCombination;
  collapsedConfigs: boolean[];
  lockeditems: { [armorType in ArmorTypes]: D1ItemWithNormalStats | null };
  setOrderValues: string[];
  lockedchanged: boolean;
}

class D1LoadoutBuilder extends React.Component<Props, State> {
  state: State = {
    active: 'titan',
    activesets: '5/5/2',
    type: 'Helmet',
    scaleType: 'scaled',
    progress: 0,
    fullMode: false,
    includeVendors: false,
    showBlues: false,
    showExotics: true,
    showYear1: false,
    lockedchanged: false,
    showAdvanced: false,
    showHelp: false,
    allSetTiers: [],
    hasSets: true,
    highestsets: {},
    activeHighestSets: [],
    ranked: {
      Helmet: [],
      Gauntlets: [],
      Chest: [],
      Leg: [],
      ClassItem: [],
      Artifact: [],
      Ghost: []
    },
    activePerks: {
      Helmet: [],
      Gauntlets: [],
      Chest: [],
      Leg: [],
      ClassItem: [],
      Artifact: [],
      Ghost: []
    },
    excludeditems: [],
    collapsedConfigs: [false, false, false, false, false, false, false, false, false, false],
    lockeditems: {
      Helmet: null,
      Gauntlets: null,
      Chest: null,
      Leg: null,
      ClassItem: null,
      Artifact: null,
      Ghost: null
    },
    lockedperks: {
      Helmet: {},
      Gauntlets: {},
      Chest: {},
      Leg: {},
      ClassItem: {},
      Artifact: {},
      Ghost: {}
    },
    setOrderValues: ['-str_val', '-dis_val', '-int_val']
  };

  componentDidMount() {
    if (!this.props.stores.length) {
      D1StoresService.getStoresStream(this.props.account);
    }

    getDefinitions().then((defs) => this.setState({ defs }));
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.stores.length === 0 && this.props.stores.length > 0) {
      // Exclude felwinters if we have them
      const felwinters = _.flatMap(this.props.stores, (store) =>
        store.items.filter((i) => i.hash === 2672107540)
      );
      if (felwinters.length) {
        this.setState({
          excludeditems: _.uniqBy([...this.state.excludeditems, ...felwinters], (i) => i.id)
        });
      }
    }

    // TODO: replace progress with state field (calculating/done)
    if (this.state.defs && this.props.stores.length && !this.state.progress) {
      this.calculateSets();
    }
  }

  render() {
    const { stores, buckets } = this.props;
    const {
      includeVendors,
      defs,
      type,
      excludeditems,
      progress,
      hasSets,
      allSetTiers,
      activesets,
      fullMode,
      scaleType,
      showBlues,
      showAdvanced,
      showHelp,
      activeHighestSets,
      collapsedConfigs,
      lockeditems,
      lockedperks,
      showExotics
    } = this.state;

    if (!stores.length || !buckets || !defs) {
      return <Loading />;
    }

    const active = this.getSelectedCharacter();

    const i18nItemNames: { [key: string]: string } = _.zipObject(
      ['Helmet', 'Gauntlets', 'Chest', 'Leg', 'ClassItem', 'Artifact', 'Ghost'],
      [45, 46, 47, 48, 49, 38, 39].map((key) => defs.ItemCategory.get(key).title)
    );

    // Armor of each type on a particular character
    // TODO: don't even need to load this much!
    const bucket = loadBucket(active, stores as D1Store[]);

    let $index = 0;

    const perks: { [classType in ClassTypes]: PerkCombination } = {
      warlock: {
        Helmet: [],
        Gauntlets: [],
        Chest: [],
        Leg: [],
        ClassItem: [],
        Ghost: [],
        Artifact: []
      },
      titan: {
        Helmet: [],
        Gauntlets: [],
        Chest: [],
        Leg: [],
        ClassItem: [],
        Ghost: [],
        Artifact: []
      },
      hunter: {
        Helmet: [],
        Gauntlets: [],
        Chest: [],
        Leg: [],
        ClassItem: [],
        Ghost: [],
        Artifact: []
      }
    };

    function filterPerks(perks: D1GridNode[], item: D1Item) {
      // ['Infuse', 'Twist Fate', 'Reforge Artifact', 'Reforge Shell', 'Increase Intellect', 'Increase Discipline', 'Increase Strength', 'Deactivate Chroma']
      const unwantedPerkHashes = [
        1270552711,
        217480046,
        191086989,
        913963685,
        1034209669,
        1263323987,
        193091484,
        2133116599
      ];
      return _.uniqBy(perks.concat(item.talentGrid!.nodes), (node: any) => node.hash).filter(
        (node: any) => !unwantedPerkHashes.includes(node.hash)
      );
    }

    function filterItems(items: D1Item[]) {
      return items.filter((item) => {
        return (
          item.primStat &&
          item.primStat.statHash === 3897883278 && // has defense hash
          item.talentGrid &&
          item.talentGrid.nodes &&
          ((showBlues && item.tier === 'Rare') ||
            item.tier === 'Legendary' ||
            (showExotics && item.isExotic)) && // is legendary or exotic
          item.stats
        );
      });
    }

    let allItems: D1Item[] = [];
    _.each(stores, (store) => {
      const items = filterItems(store.items);

      allItems = allItems.concat(items);

      // Build a map of perks
      _.each(items, (item) => {
        if (item.classType === 3) {
          _.each(['warlock', 'titan', 'hunter'], (classType) => {
            perks[classType][item.type] = filterPerks(perks[classType][item.type], item);
          });
        } else {
          perks[item.classTypeName][item.type] = filterPerks(
            perks[item.classTypeName][item.type],
            item
          );
        }
      });
    });
    const activePerks = perks[active.class];

    // TODO: include vendor items

    return (
      <div className="loadout-builder dim-page itemQuality">
        <CharacterSelect
          selectedStore={active}
          stores={stores}
          onCharacterChanged={this.onSelectedChange}
        />
        <LoadoutDrawer />
        <CollapsibleTitle
          defaultCollapsed={true}
          sectionId="lb1-classitems"
          title={t('LB.ShowGear', { class: active.className })}
        >
          <div className="section">
            {/* TODO: break into its own component */}
            <span>{t('Bucket.Armor')}</span>:{' '}
            <select name="type" value={type} onChange={this.onChange}>
              {_.map(i18nItemNames, (name, type) => (
                <option key={type} value={type}>
                  {name}
                </option>
              ))}
            </select>
            <label>
              <input
                className="vendor-checkbox"
                type="checkbox"
                name="includeVendors"
                checked={includeVendors}
                onChange={this.onIncludeVendorsChange}
              />{' '}
              {t('LB.Vendor')}
            </label>
            <div className="loadout-builder-section">
              {_.sortBy(
                bucket[type].filter((i) => i.primStat!.value >= 280),
                (i) => -i.quality!.min
              ).map((item) => (
                <div key={item.index} className="item-container">
                  <div className="item-stats">
                    {item.stats!.map((stat) => (
                      <div
                        key={stat.id}
                        style={getColor(
                          item.normalStats![stat.statHash].qualityPercentage,
                          'color'
                        )}
                      >
                        {item.normalStats![stat.statHash].scaled === 0 && <small>-</small>}
                        {item.normalStats![stat.statHash].scaled > 0 && (
                          <span>
                            <small>{item.normalStats![stat.statHash].scaled}</small>/
                            <small>{stat.split}</small>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div>
                    <LoadoutBuilderItem shiftClickCallback={this.excludeItem} item={item} />
                  </div>
                  {/* TODO: draggable item
                  <div ui-draggable="true" drag-channel="item.bucket.type" drag="item.index">
                    <LoadoutBuilderItem shiftClickCallback={this.excludeItem} item={item} />
                  </div>
                  */}
                </div>
              ))}
            </div>
          </div>
        </CollapsibleTitle>
        <div className="section">
          <p>
            <span className="dim-button locked-button" onClick={this.lockEquipped}>
              {t('LB.LockEquipped')}
            </span>
            <span className="dim-button locked-button" onClick={this.clearLocked}>
              {t('LB.ClearLocked')}
            </span>
            <span>{t('LB.Locked')}</span> - <small>{t('LB.LockedHelp')}</small>
          </p>
          <LoadoutBuilderLocks
            lockedItems={lockeditems}
            lockedPerks={lockedperks}
            activePerks={activePerks}
            i18nItemNames={i18nItemNames}
            onRemove={this.onRemove}
            onPerkLocked={this.onPerkLocked}
          />
        </div>
        <div className="section" ng-show="excludeditems.length">
          <p>
            <span>{t('LB.Exclude')}</span> - <small>{t('LB.ExcludeHelp')}</small>
          </p>
          <div className="loadout-builder-section">
            <div
              className="excluded-container"
              drag-channel="Helmet, Gauntlets, Chest, Leg, ClassItem, Ghost, Artifact"
              drop-channel="Helmet, Gauntlets, Chest, Leg, ClassItem, Ghost, Artifact"
              ui-on-drop="onExcludedDrop($data, $channel)"
              drop-validate="excludedItemsValid($data, $channel)"
            >
              <div className="excluded-items">
                {excludeditems.map((excludeditem) => (
                  <div key={excludeditem.index} className="excluded-item">
                    {/*<div
                    ui-draggable="true"
                    drag-channel="{excludeditem.bucket.type}"
                    drag="excludeditem.index"
                  > */}
                    <LoadoutBuilderItem item={excludeditem} />
                    {/* </div>*/}
                    <div
                      className="close"
                      onClick={() => this.onExcludedRemove(excludeditem.index)}
                      role="button"
                      tabIndex={0}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {progress >= 1 && hasSets && (
          <div>
            <p>
              {t('LB.FilterSets')} ({t('Stats.Intellect')}/{t('Stats.Discipline')}/
              {t('Stats.Strength')}):{' '}
              <select name="activesets" onChange={this.onActiveSetsChange} value={activesets}>
                {allSetTiers.map((val) => (
                  <option disabled={val.charAt(0) === '-'} value={val}>
                    {val}
                  </option>
                ))}
              </select>{' '}
              <span className="dim-button" onClick={this.toggleShowAdvanced}>
                {t('LB.AdvancedOptions')}
              </span>{' '}
              <span className="dim-button" onClick={this.toggleShowHelp}>
                {t('LB.Help.Help')}
              </span>
              <span>
                {showAdvanced && (
                  <div>
                    <p>
                      <label>
                        <select
                          name="fullMode"
                          onChange={this.onModeChange}
                          value={fullMode ? 'true' : 'false'}
                        >
                          <option value="false">{t('LB.ProcessingMode.Fast')}</option>
                          <option value="true">{t('LB.ProcessingMode.Full')}</option>
                        </select>
                        <span>{t('LB.ProcessingMode.ProcessingMode')}</span>
                      </label>
                      <small>
                        -{' '}
                        {fullMode
                          ? t('LB.ProcessingMode.HelpFull')
                          : t('LB.ProcessingMode.HelpFast')}
                      </small>
                    </p>
                    <p>
                      <label>
                        <select name="scaleType" value={scaleType} onChange={this.onModeChange}>
                          <option value="scaled">{t('LB.Scaled')}</option>
                          <option value="base">{t('LB.Current')}</option>
                        </select>
                        <span>{t('LB.LightMode.LightMode')}</span>
                      </label>
                      <small>
                        - {scaleType === 'scaled' && t('LB.LightMode.HelpScaled')}
                        {scaleType === 'base' && t('LB.LightMode.HelpCurrent')}
                      </small>
                    </p>
                    <p>
                      <label>
                        <input
                          type="checkbox"
                          name="showBlues"
                          checked={showBlues}
                          onChange={this.onModeChange}
                        />
                        <span>{t('LB.IncludeRare')}</span>
                      </label>
                    </p>
                  </div>
                )}
              </span>
              <span>
                {showHelp && (
                  <div>
                    <ul>
                      <li>{t('LB.Help.Lock')}</li>
                      <ul>
                        <li>{t('LB.Help.NoPerk')}</li>
                        <li>{t('LB.Help.MultiPerk')}</li>
                        <li>
                          <div className="example ex-or">- {t('LB.Help.Or')}</div>
                        </li>
                        <li>
                          <div className="example ex-and">- {t('LB.Help.And')}</div>
                        </li>
                      </ul>
                      <li>{t('LB.Help.DragAndDrop')}</li>
                      <li>{t('LB.Help.ShiftClick')}</li>
                      <li>{t('LB.Help.HigherTiers')}</li>
                      <ul>
                        <li>{t('LB.Help.Tier11Example')}</li>
                        <li>{t('LB.Help.Intellect')}</li>
                        <li>{t('LB.Help.Discipline')}</li>
                        <li>{t('LB.Help.Strength')}</li>
                      </ul>
                      <li>{t('LB.Help.Synergy')}</li>
                      <li>{t('LB.Help.ChangeNodes')}</li>
                      <li>{t('LB.Help.StatsIncrease')}</li>
                    </ul>
                  </div>
                )}
              </span>
            </p>
          </div>
        )}
        {progress >= 1 && !hasSets && (
          <div>
            <p>{showBlues ? t('LB.Missing2') : t('LB.Missing1')}</p>
            <p>
              <label>
                <input
                  className="includeRares"
                  type="checkbox"
                  name="showBlues"
                  checked={showBlues}
                  onChange={this.onModeChange}
                />
                {t('LB.IncludeRare')}
              </label>
            </p>
          </div>
        )}
        {progress < 1 && hasSets && (
          <div>
            <p>
              {t('LB.Loading')} <AppIcon icon={refreshIcon} className="fa-spin" />
            </p>
          </div>
        )}
        {progress >= 1 && (
          <div>
            {_.map(activeHighestSets, (setType) => {
              return (
                <div key={setType.set.setHash} className="section loadout">
                  <div className="loadout-builder-controls">
                    {setType.set.includesVendorItems ? (
                      <span>{t('LB.ContainsVendorItems')}</span>
                    ) : (
                      <>
                        <span className="dim-button" onClick={() => this.newLoadout(setType.set)}>
                          {t('Loadouts.Create')}
                        </span>
                        <span
                          className="dim-button equip-button"
                          onClick={() => this.equipItems(setType.set)}
                        >
                          {t('LB.Equip', { character: active.name })}
                        </span>
                      </>
                    )}{' '}
                    <div className="dim-stats">
                      <CharacterStats destinyVersion={1} stats={setType.tiers[activesets].stats} />
                    </div>
                  </div>
                  <div className="loadout-builder-section">
                    {_.map(setType.set.armor, (armorpiece, type) => (
                      <div key={type} className="set-item">
                        {/*<div
                        ui-draggable="true"
                        drag-channel="{ armorpiece.item.bucket.type }"
                        drag="armorpiece.item.index"
                      >*/}
                        <LoadoutBuilderItem
                          shift-click-callback={this.excludeItem}
                          item={armorpiece.item}
                        />
                        {/*</div>*/}
                        <div className="smaller">
                          <ItemTalentGrid
                            talent-grid={armorpiece.item.talentGrid}
                            perks-only={true}
                          />
                        </div>
                        <div className="label">
                          <small>
                            {setType.tiers[activesets].configs[0][armorpiece.item.type] === 'int'
                              ? t('Stats.Intellect')
                              : setType.tiers[activesets].configs[0][armorpiece.item.type] === 'dis'
                              ? t('Stats.Discipline')
                              : setType.tiers[activesets].configs[0][armorpiece.item.type] === 'str'
                              ? t('Stats.Strength')
                              : t('Stats.NoBonus')}
                          </small>
                        </div>
                        {setType.tiers[activesets].configs.map(
                          (config, i) =>
                            i > 0 &&
                            false && (
                              <div
                                className="other-configs"
                                ng-show="collapsedConfigs[$parent.$parent.$parent.$index]"
                              >
                                <small>
                                  {config[armorpiece.item.type] === 'int'
                                    ? t('Stats.Intellect')
                                    : config[armorpiece.item.type] === 'dis'
                                    ? t('Stats.Discipline')
                                    : config[armorpiece.item.type] === 'str'
                                    ? t('Stats.Strength')
                                    : t('Stats.NoBonus')}
                                </small>
                              </div>
                            )
                        )}
                      </div>
                    ))}
                  </div>
                  {setType.tiers[activesets].configs.length > 1 && (
                    <div className="expand-configs" onClick={() => this.toggleCollapsedConfigs(1)}>
                      {collapsedConfigs[$index] ? (
                        <div>
                          <span title={t('LB.HideConfigs')}>
                            <AppIcon icon={collapseIcon} />
                          </span>{' '}
                          {t('LB.HideAllConfigs')}
                        </div>
                      ) : (
                        <div>
                          <span title={t('LB.ShowConfigs')}>
                            <AppIcon icon={expandIcon} />
                          </span>{' '}
                          {t('LB.ShowAllConfigs')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
              $index++;
            })}
          </div>
        )}
      </div>
    );
  }

  private getSelectedCharacter = () =>
    this.state.selectedCharacter || this.props.stores.find((s) => s.current)!;

  private calculateSets = () => {
    const active = this.getSelectedCharacter();
    getSetBucketsStep(
      active,
      loadBucket(active, this.props.stores),
      {
        Helmet: [],
        Gauntlets: [],
        Chest: [],
        Leg: [],
        ClassItem: [],
        Artifact: [],
        Ghost: []
      },
      this.state.lockeditems,
      this.state.lockedperks,
      this.state.excludeditems,
      this.state.scaleType
    ).then((result) => {
      this.setState({ ...(result as any), progress: 1 });
    });
  };

  private toggleShowHelp = () => this.setState((state) => ({ showHelp: !state.showHelp }));
  private toggleShowAdvanced = () =>
    this.setState((state) => ({ showAdvanced: !state.showAdvanced }));

  private toggleCollapsedConfigs = (index) => {
    /* */
  };

  private onChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
    if (e.target.name.length === 0) {
      console.error(new Error('You need to have a name on the form input'));
    }

    if (isInputElement(e.target) && e.target.type === 'checkbox') {
      this.setState({ [e.target.name as any]: e.target.checked } as any);
    } else {
      this.setState({ [e.target.name as any]: e.target.value } as any);
    }
  };

  private lockedItemsValid = (droppedId: string, droppedType: ArmorTypes) => {
    return true;
    /*
    droppedId = getId(droppedId);
    if (alreadyExists(excludeditems, droppedId)) {
      return false;
    }

    const item = getItemById(droppedId, droppedType)!;
    const startCount: number = item.isExotic && item.type !== 'ClassItem' ? 1 : 0;
    return (
      startCount +
        (droppedType !== 'Helmet' && lockeditems.Helmet && lockeditems.Helmet.isExotic
          ? 1
          : 0) +
        (droppedType !== 'Gauntlets' &&
        lockeditems.Gauntlets &&
        lockeditems.Gauntlets.isExotic
          ? 1
          : 0) +
        (droppedType !== 'Chest' && lockeditems.Chest && lockeditems.Chest.isExotic
          ? 1
          : 0) +
        (droppedType !== 'Leg' && lockeditems.Leg && lockeditems.Leg.isExotic ? 1 : 0) <
      2
    );
    */
  };
  /*
  private excludedItemsValid(droppedId: string, droppedType: ArmorTypes) {
    const lockedItem = lockeditems[droppedType];
    return !(lockedItem && alreadyExists([lockedItem], droppedId));
  }
  */
  private onSelectedChange = (storeId: string) => {
    this.setState({ selectedCharacter: this.props.stores.find((s) => s.id === storeId) });
    /*
    if (activeCharacters[prevIdx].class !== activeCharacters[selectedIdx].class) {
      const classType = activeCharacters[selectedIdx].class;
      if (classType !== 'vault') {
        active = classType;
      }
      onCharacterChange();
      selectedCharacter = selectedIdx;
    }
    */
  };
  /*
  private onCharacterChange() {
    ranked = getActiveBuckets(
      buckets[active],
      vendorBuckets[active],
      includeVendors
    );
    activeCharacters = D1StoresService.getStores().filter((s) => !s.isVault);
    const activeStore = D1StoresService.getActiveStore()!;
    selectedCharacter = _.findIndex(
      activeCharacters,
      (char) => char.id === activeStore.id
    );
    activePerks = getActiveBuckets(
      perks[active],
      vendorPerks[active],
      includeVendors
    );
    lockeditems = {
      Helmet: null,
      Gauntlets: null,
      Chest: null,
      Leg: null,
      ClassItem: null,
      Artifact: null,
      Ghost: null
    };
    lockedperks = {
      Helmet: {},
      Gauntlets: {},
      Chest: {},
      Leg: {},
      ClassItem: {},
      Artifact: {},
      Ghost: {}
    };
    excludeditems = excludeditems.filter((item: D1Item) => item.hash === 2672107540);
    activesets = '';
    highestsets = getSetBucketsStep(active);
  }
  */
  private onActiveSetsChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    /*activeHighestSets = getActiveHighestSets(highestsets, activesets);*/
  };
  private onModeChange = () => {
    // highestsets = getSetBucketsStep(active);
  };
  private onIncludeVendorsChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const includeVendors = e.target.checked;
    /*
    activePerks = getActiveBuckets(perks[active], vendorPerks[active], includeVendors);
    if (includeVendors) {
      ranked = mergeBuckets(buckets[active], vendorBuckets[active]);
    } else {
      ranked = buckets[active];

      // Filter any vendor items from locked or excluded items
      _.each(lockeditems, (item, type) => {
        if (item && item.isVendorItem) {
          lockeditems[type] = null;
        }
      });

      excludeditems = _.filter(excludeditems, (item) => {
        return !item.isVendorItem;
      });

      // Filter any vendor perks from locked perks
      _.each(lockedperks, (perkMap, type) => {
        lockedperks[type] = _.omitBy(perkMap, (_perk, perkHash) => {
          return _.find(vendorPerks[active][type], { hash: Number(perkHash) });
        });
      });
    }
    highestsets = getSetBucketsStep(active);
    */

    this.setState({ includeVendors });
  };
  private onPerkLocked = (perk: D1GridNode, type: ArmorTypes, $event: React.MouseEvent) => {
    const { lockedperks } = this.state;
    const lockedPerk = lockedperks[type][perk.hash];
    const activeType = $event.shiftKey
      ? lockedPerk && lockedPerk.lockType === 'and'
        ? 'none'
        : 'and'
      : lockedPerk && lockedPerk.lockType === 'or'
      ? 'none'
      : 'or';

    const newLockedPerks = produce(lockedperks, (lockedperks) => {
      if (activeType === 'none') {
        delete lockedperks[type][perk.hash];
      } else {
        lockedperks[type][perk.hash] = {
          icon: perk.icon,
          description: perk.description,
          lockType: activeType
        };
      }
    });

    // TODO: include vendors
    // TODO: make this trigger recalc
    this.setState({ lockedperks: newLockedPerks, progress: 0 });
  };
  private onDrop = (droppedId, type) => {
    /*
    droppedId = getId(droppedId);
    if (lockeditems[type] && alreadyExists([lockeditems[type]], droppedId)) {
      return;
    }
    const item = getItemById(droppedId, type);
    lockeditems[type] = item;
    highestsets = getSetBucketsStep(active);
    if (progress < 1) {
      lockedchanged = true;
    }
    */
  };
  private onRemove = (removedType) => {
    /*
    lockeditems[removedType] = null;

    highestsets = getSetBucketsStep(active);
    if (progress < 1) {
      lockedchanged = true;
    }
    */
  };
  private excludeItem = (item: D1Item) => {
    this.onExcludedDrop(item.index, item.type);
  };
  private onExcludedDrop = (droppedId, type) => {
    /*
    droppedId = getId(droppedId);
    if (
      alreadyExists(excludeditems, droppedId) ||
      (lockeditems[type] && alreadyExists([lockeditems[type]], droppedId))
    ) {
      return;
    }
    const item = getItemById(droppedId, type)!;
    excludeditems.push(item);
    highestsets = getSetBucketsStep(active);
    if (progress < 1) {
      excludedchanged = true;
    }
    */
  };
  private onExcludedRemove = (removedIndex: string) => {
    /*
    excludeditems = excludeditems.filter(
      (excludeditem) => excludeditem.index !== removedIndex
    );
    highestsets = getSetBucketsStep(active);
    if (progress < 1) {
      excludedchanged = true;
    }
    */
  };

  private lockEquipped = () => {
    const store = this.getSelectedCharacter();
    const loadout = filterLoadoutToEquipped(store.loadoutFromCurrentlyEquipped(''));
    const items = _.pick(
      loadout.items,
      'helmet',
      'gauntlets',
      'chest',
      'leg',
      'classitem',
      'artifact',
      'ghost'
    );

    function nullWithoutStats(items: DimItem[]) {
      return items[0].stats ? (items[0] as D1Item) : null;
    }

    // Do not lock items with no stats
    this.setState({
      lockeditems: {
        Helmet: nullWithoutStats(items.helmet),
        Gauntlets: nullWithoutStats(items.gauntlets),
        Chest: nullWithoutStats(items.chest),
        Leg: nullWithoutStats(items.leg),
        ClassItem: nullWithoutStats(items.classitem),
        Artifact: nullWithoutStats(items.artifact),
        Ghost: nullWithoutStats(items.ghost)
      },
      progress: 0
    });
  };

  private clearLocked = () => {
    this.setState({
      lockeditems: {
        Helmet: null,
        Gauntlets: null,
        Chest: null,
        Leg: null,
        ClassItem: null,
        Artifact: null,
        Ghost: null
      },
      activesets: '',
      progress: 0
    });
  };

  private newLoadout = (set) => {
    /*
    const loadout = newLoadout('', {});
    loadout.classType = LoadoutClass[active];
    const items = _.pick(
      set.armor,
      'Helmet',
      'Chest',
      'Gauntlets',
      'Leg',
      'ClassItem',
      'Ghost',
      'Artifact'
    );
    _.each(items, (itemContainer: any, itemType) => {
      loadout.items[itemType.toString().toLowerCase()] = [itemContainer.item];
    });

    dimLoadoutService.editLoadout(loadout, {
      equipAll: true,
      showClass: false
    });
    */
  };
  private equipItems = (set) => {
    /*
    ngDialog.closeAll();
    let loadout: Loadout = newLoadout($i18next.t('Loadouts.AppliedAuto'), {});
    loadout.classType = LoadoutClass[active];
    const items = _.pick(
      set.armor,
      'Helmet',
      'Chest',
      'Gauntlets',
      'Leg',
      'ClassItem',
      'Ghost',
      'Artifact'
    );
    loadout.items.helmet = [items.Helmet.item];
    loadout.items.chest = [items.Chest.item];
    loadout.items.gauntlets = [items.Gauntlets.item];
    loadout.items.leg = [items.Leg.item];
    loadout.items.classitem = [items.ClassItem.item];
    loadout.items.ghost = [items.Ghost.item];
    loadout.items.artifact = [items.Artifact.item];

    loadout = copy(loadout);

    _.each(loadout.items, (val) => {
      val[0].equipped = true;
    });

    return dimLoadoutService.applyLoadout(activeCharacters[selectedCharacter], loadout, true);
    */
  };
  /*
  private getSetBucketsStep(activeGuardian: string): typeof this.highestsets | null {
    const bestArmor: any = getBestArmor(
      buckets[activeGuardian],
      vendorBuckets[activeGuardian],
      lockeditems,
      excludeditems,
      lockedperks
    );
    const helms = bestArmor.Helmet || [];
    const gaunts = bestArmor.Gauntlets || [];
    const chests = bestArmor.Chest || [];
    const legs = bestArmor.Leg || [];
    const classItems = bestArmor.ClassItem || [];
    const ghosts = bestArmor.Ghost || [];
    const artifacts = bestArmor.Artifact || [];
    const setMap = {};
    const tiersSet = new Set<string>();
    const combos =
      helms.length *
      gaunts.length *
      chests.length *
      legs.length *
      classItems.length *
      ghosts.length *
      artifacts.length;
    if (combos === 0) {
      return null;
    }

    hasSets = false;

    function step(activeGuardian, h, g, c, l, ci, gh, ar, processedCount) {
      for (; h < helms.length; ++h) {
        for (; g < gaunts.length; ++g) {
          for (; c < chests.length; ++c) {
            for (; l < legs.length; ++l) {
              for (; ci < classItems.length; ++ci) {
                for (; gh < ghosts.length; ++gh) {
                  for (; ar < artifacts.length; ++ar) {
                    const validSet =
                      Number(helms[h].item.isExotic) +
                        Number(gaunts[g].item.isExotic) +
                        Number(chests[c].item.isExotic) +
                        Number(legs[l].item.isExotic) <
                      2;

                    if (validSet) {
                      const set: ArmorSet = {
                        armor: {
                          Helmet: helms[h],
                          Gauntlets: gaunts[g],
                          Chest: chests[c],
                          Leg: legs[l],
                          ClassItem: classItems[ci],
                          Artifact: artifacts[ar],
                          Ghost: ghosts[gh]
                        },
                        stats: {
                          STAT_INTELLECT: {
                            value: 0,
                            tier: 0,
                            name: 'Intellect',
                            icon: intellectIcon
                          },
                          STAT_DISCIPLINE: {
                            value: 0,
                            tier: 0,
                            name: 'Discipline',
                            icon: disciplineIcon
                          },
                          STAT_STRENGTH: {
                            value: 0,
                            tier: 0,
                            name: 'Strength',
                            icon: strengthIcon
                          }
                        },
                        setHash: '',
                        includesVendorItems: false
                      };

                      hasSets = true;
                      const pieces = Object.values(set.armor);
                      set.setHash = genSetHash(pieces);
                      calcArmorStats(pieces, set.stats);
                      const tiersString = `${set.stats.STAT_INTELLECT.tier}/${
                        set.stats.STAT_DISCIPLINE.tier
                      }/${set.stats.STAT_STRENGTH.tier}`;

                      tiersSet.add(tiersString);

                      // Build a map of all sets but only keep one copy of armor
                      // so we reduce memory usage
                      if (setMap[set.setHash]) {
                        if (setMap[set.setHash].tiers[tiersString]) {
                          setMap[set.setHash].tiers[tiersString].configs.push(
                            getBonusConfig(set.armor)
                          );
                        } else {
                          setMap[set.setHash].tiers[tiersString] = {
                            stats: set.stats,
                            configs: [getBonusConfig(set.armor)]
                          };
                        }
                      } else {
                        setMap[set.setHash] = { set, tiers: {} };
                        setMap[set.setHash].tiers[tiersString] = {
                          stats: set.stats,
                          configs: [getBonusConfig(set.armor)]
                        };
                      }

                      set.includesVendorItems = pieces.some(
                        (armor: any) => armor.item.isVendorItem
                      );
                    }

                    processedCount++;
                    if (processedCount % 50000 === 0) {
                      // do this so the page doesn't lock up
                      if (
                        active !== activeGuardian ||
                        lockedchanged ||
                        excludedchanged ||
                        perkschanged ||
                        !transition.router.stateService.is('destiny1.loadout-builder')
                      ) {
                        // If active guardian or page is changed then stop processing combinations
                        lockedchanged = false;
                        excludedchanged = false;
                        perkschanged = false;
                        return;
                      }
                      progress = processedCount / combos;
                      $timeout(
                        step,
                        0,
                        true,
                        activeGuardian,
                        h,
                        g,
                        c,
                        l,
                        ci,
                        gh,
                        ar,
                        processedCount
                      );
                      return;
                    }
                  }
                  ar = 0;
                }
                gh = 0;
              }
              ci = 0;
            }
            l = 0;
          }
          c = 0;
        }
        g = 0;
      }

      const tiers = _.each(
        _.groupBy(Array.from(tiersSet.keys()), (tierString: string) => {
          return _.sumBy(tierString.split('/'), (num) => parseInt(num, 10));
        }),
        (tier) => {
          tier.sort().reverse();
        }
      );

      allSetTiers = [];
      const tierKeys = Object.keys(tiers);
      for (let t = tierKeys.length; t > tierKeys.length - 3; t--) {
        if (tierKeys[t]) {
          allSetTiers.push(`- Tier ${tierKeys[t]} -`);
          _.each(tiers[tierKeys[t]], (set) => {
            allSetTiers.push(set);
          });
        }
      }

      if (!allSetTiers.includes(activesets)) {
        activesets = allSetTiers[1];
      }
      activeHighestSets = getActiveHighestSets(setMap, activesets);
      collapsedConfigs = [
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false
      ];

      // Finish progress
      progress = processedCount / combos;
      console.log('processed', combos, 'combinations.');
    }
    lockedchanged = false;
    excludedchanged = false;
    perkschanged = false;
    $timeout(step, 0, true, activeGuardian, 0, 0, 0, 0, 0, 0, 0, 0);
    return setMap;
  }
  getBonus
  private getStore = D1StoresService.getStore;
  private getItems() {
    const stores = D1StoresService.getStores();
    stores = stores;

    if (stores.length === 0) {
      transition.router.stateService.go('destiny1.inventory');
      return;
    }

    function filterPerks(perks: D1GridNode[], item: D1Item) {
      // ['Infuse', 'Twist Fate', 'Reforge Artifact', 'Reforge Shell', 'Increase Intellect', 'Increase Discipline', 'Increase Strength', 'Deactivate Chroma']
      const unwantedPerkHashes = [
        1270552711,
        217480046,
        191086989,
        913963685,
        1034209669,
        1263323987,
        193091484,
        2133116599
      ];
      return _.uniqBy(perks.concat(item.talentGrid!.nodes), (node: any) => node.hash).filter(
        (node: any) => !unwantedPerkHashes.includes(node.hash)
      );
    }

    function filterItems(items: D1Item[]) {
      return items.filter((item) => {
        return (
          item.primStat &&
          item.primStat.statHash === 3897883278 && // has defense hash
          item.talentGrid &&
          item.talentGrid.nodes &&
          ((showBlues && item.tier === 'Rare') ||
            item.tier === 'Legendary' ||
            (showExotics && item.isExotic)) && // is legendary or exotic
          item.stats
        );
      });
    }

    selectedCharacter = D1StoresService.getActiveStore();
    active = selectedCharacter.class.toLowerCase() || 'warlock';
    activeCharacters = _.reject(D1StoresService.getStores(), (s) => s.isVault);
    selectedCharacter = _.findIndex(
      activeCharacters,
      (char) => char.id === selectedCharacter.id
    );

    let allItems: D1Item[] = [];
    let vendorItems: D1Item[] = [];
    _.each(stores, (store) => {
      const items = filterItems(store.items);

      // Exclude felwinters if we have them
      const felwinters = items.filter((i) => i.hash === 2672107540);
      if (felwinters.length) {
        excludeditems.push(...felwinters);
        excludeditems = _.uniqBy(excludeditems, (i) => i.id);
      }

      allItems = allItems.concat(items);

      // Build a map of perks
      _.each(items, (item) => {
        if (item.classType === 3) {
          _.each(['warlock', 'titan', 'hunter'], (classType) => {
            perks[classType][item.type] = filterPerks(perks[classType][item.type], item);
          });
        } else {
          perks[item.classTypeName][item.type] = filterPerks(
            perks[item.classTypeName][item.type],
            item
          );
        }
      });
    });

    // Process vendors here
    _.each(dimVendorService.vendors, (vendor: any) => {
      const vendItems = filterItems(
        vendor.allItems
          .map((i) => i.item)
          .filter(
            (item) =>
              item.bucket.sort === 'Armor' || item.type === 'Artifact' || item.type === 'Ghost'
          )
      );
      vendorItems = vendorItems.concat(vendItems);

      // Exclude felwinters if we have them
      const felwinters = vendorItems.filter((i) => i.hash === 2672107540);
      if (felwinters.length) {
        excludeditems.push(...felwinters);
        excludeditems = _.uniqBy(excludeditems, (i) => i.id);
      }

      // Build a map of perks
      _.each(vendItems, (item) => {
        if (item.classType === 3) {
          _.each(['warlock', 'titan', 'hunter'], (classType) => {
            vendorPerks[classType][item.type] = filterPerks(
              vendorPerks[classType][item.type],
              item
            );
          });
        } else {
          vendorPerks[item.classTypeName][item.type] = filterPerks(
            vendorPerks[item.classTypeName][item.type],
            item
          );
        }
      });
    });

    // Remove overlapping perks in allPerks from vendorPerks
    _.each(vendorPerks, (perksWithType, classType) => {
      _.each(perksWithType, (perkArr, type) => {
        vendorPerks[classType][type] = _.reject(perkArr, (perk: any) =>
          perks[classType][type].map((i) => i.hash).includes(perk.hash)
        );
      });
    });

    function initBuckets() {
      function normalizeStats(item: D1ItemWithNormalStats) {
        item.normalStats = {};
        _.each(item.stats!, (stat: any) => {
          item.normalStats![stat.statHash] = {
            statHash: stat.statHash,
            base: stat.base,
            scaled: stat.scaled ? stat.scaled.min : 0,
            bonus: stat.bonus,
            split: stat.split,
            qualityPercentage: stat.qualityPercentage ? stat.qualityPercentage.min : 0
          };
        });
        return item;
      }
      function getBuckets(items: D1Item[]): ItemBucket {
        return {
          Helmet: items
            .filter((item) => {
              return item.type === 'Helmet';
            })
            .map(normalizeStats),
          Gauntlets: items
            .filter((item) => {
              return item.type === 'Gauntlets';
            })
            .map(normalizeStats),
          Chest: items
            .filter((item) => {
              return item.type === 'Chest';
            })
            .map(normalizeStats),
          Leg: items
            .filter((item) => {
              return item.type === 'Leg';
            })
            .map(normalizeStats),
          ClassItem: items
            .filter((item) => {
              return item.type === 'ClassItem';
            })
            .map(normalizeStats),
          Artifact: items
            .filter((item) => {
              return item.type === 'Artifact';
            })
            .map(normalizeStats),
          Ghost: items
            .filter((item) => {
              return item.type === 'Ghost';
            })
            .map(normalizeStats)
        };
      }
      function loadBucket(classType: DestinyClass, useVendorItems = false): ItemBucket {
        const items = useVendorItems ? vendorItems : allItems;
        return getBuckets(
          items.filter((item) => {
            return (
              (item.classType === classType || item.classType === 3) &&
              item.stats &&
              item.stats.length
            );
          })
        );
      }
      buckets = {
        titan: loadBucket(0),
        hunter: loadBucket(1),
        warlock: loadBucket(2)
      };

      vendorBuckets = {
        titan: loadBucket(0, true),
        hunter: loadBucket(1, true),
        warlock: loadBucket(2, true)
      };
    }

    initBuckets(); // Get items
    onCharacterChange(); // Start processing
  }
  */
}

export default connect(mapStateToProps)(D1LoadoutBuilder);

function isInputElement(element: HTMLElement): element is HTMLInputElement {
  return element.nodeName === 'INPUT';
}
