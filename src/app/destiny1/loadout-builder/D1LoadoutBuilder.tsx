import React from 'react';
import CharacterSelect from '../../dim-ui/CharacterSelect';
import './loadout-builder.scss';
import { D1Item, D1GridNode, DimItem } from '../../inventory/item-types';
import {
  ArmorTypes,
  LockedPerkHash,
  ClassTypes,
  SetType,
  PerkCombination,
  D1ItemWithNormalStats,
} from './types';
import _ from 'lodash';
import { connect } from 'react-redux';
import { DestinyAccount } from '../../accounts/destiny-account';
import { D1Store } from '../../inventory/store-types';
import { RootState } from 'app/store/types';
import { storesSelector, bucketsSelector } from '../../inventory/selectors';
import { currentAccountSelector } from 'app/accounts/selectors';
import { D1StoresService } from '../../inventory/d1-stores';
import CollapsibleTitle from '../../dim-ui/CollapsibleTitle';
import { t } from 'app/i18next-t';
import LoadoutDrawer from '../../loadout/LoadoutDrawer';
import { D1ManifestDefinitions } from '../d1-definitions';
import { InventoryBuckets } from '../../inventory/inventory-buckets';
import { getColor } from '../../shell/filters';
import {
  loadBucket,
  getActiveBuckets,
  loadVendorsBucket,
  mergeBuckets,
  getActiveHighestSets,
} from './utils';
import LoadoutBuilderItem from './LoadoutBuilderItem';
import { getSetBucketsStep } from './calculate';
import { refreshIcon, AppIcon } from '../../shell/icons';
import { produce } from 'immer';
import GeneratedSet from './GeneratedSet';
import LoadoutBuilderLockPerk from './LoadoutBuilderLockPerk';
import ExcludeItemsDropTarget from './ExcludeItemsDropTarget';
import { dimVendorService, Vendor } from '../vendors/vendor.service';
import ErrorBoundary from '../../dim-ui/ErrorBoundary';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';

interface StoreProps {
  account: DestinyAccount;
  stores: D1Store[];
  buckets?: InventoryBuckets;
  defs?: D1ManifestDefinitions;
  isPhonePortrait: boolean;
}

type Props = StoreProps;

function mapStateToProps(state: RootState): StoreProps {
  return {
    account: currentAccountSelector(state)!,
    buckets: bucketsSelector(state),
    stores: storesSelector(state) as D1Store[],
    defs: state.manifest.d1Manifest,
    isPhonePortrait: state.shell.isPhonePortrait,
  };
}

interface State {
  selectedCharacter?: D1Store;
  excludeditems: D1Item[];
  lockedperks: { [armorType in ArmorTypes]: LockedPerkHash };
  activesets: string;
  type: ArmorTypes;
  scaleType: 'base' | 'scaled';
  progress: number;
  fullMode: boolean;
  includeVendors: boolean;
  showHelp: boolean;
  showAdvanced: boolean;
  allSetTiers: string[];
  highestsets: { [setHash: number]: SetType };
  lockeditems: { [armorType in ArmorTypes]: D1ItemWithNormalStats | null };
  vendors?: {
    [vendorHash: number]: Vendor;
  };
  loadingVendors: boolean;
}

const allClassTypes: ClassTypes[] = [DestinyClass.Titan, DestinyClass.Warlock, DestinyClass.Hunter];

class D1LoadoutBuilder extends React.Component<Props, State> {
  state: State = {
    activesets: '5/5/2',
    type: 'Helmet',
    scaleType: 'scaled',
    progress: 0,
    fullMode: false,
    includeVendors: false,
    showAdvanced: false,
    showHelp: false,
    loadingVendors: false,
    allSetTiers: [],
    highestsets: {},
    excludeditems: [],
    lockeditems: {
      Helmet: null,
      Gauntlets: null,
      Chest: null,
      Leg: null,
      ClassItem: null,
      Artifact: null,
      Ghost: null,
    },
    lockedperks: {
      Helmet: {},
      Gauntlets: {},
      Chest: {},
      Leg: {},
      ClassItem: {},
      Artifact: {},
      Ghost: {},
    },
  };

  private cancelToken: { cancelled: boolean } = {
    cancelled: false,
  };

  componentDidMount() {
    if (!this.props.stores.length) {
      D1StoresService.getStoresStream(this.props.account);
    }

    if (this.props.stores.length > 0) {
      // Exclude felwinters if we have them, but only the first time stores load
      const felwinters = this.props.stores.flatMap((store) =>
        store.items.filter((i) => i.hash === 2672107540)
      );
      if (felwinters.length) {
        this.setState(({ excludeditems }) => ({
          excludeditems: _.uniqBy([...excludeditems, ...felwinters], (i) => i.id),
        }));
      }
    }
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (prevProps.stores.length === 0 && this.props.stores.length > 0) {
      // Exclude felwinters if we have them, but only the first time stores load
      const felwinters = this.props.stores.flatMap((store) =>
        store.items.filter((i) => i.hash === 2672107540)
      );
      if (felwinters.length) {
        this.setState(({ excludeditems }) => ({
          excludeditems: _.uniqBy([...excludeditems, ...felwinters], (i) => i.id),
        }));
      }
    }

    // TODO: replace progress with state field (calculating/done)
    if (this.props.defs && this.props.stores.length && !this.state.progress) {
      this.calculateSets();
    }

    if (this.state.includeVendors && !this.state.vendors && !this.state.loadingVendors) {
      this.setState({ loadingVendors: true });
      dimVendorService.getVendorsStream(this.props.account).subscribe(([_, vendors]) => {
        this.setState({ vendors, loadingVendors: false });
        dimVendorService.requestRatings();
      });
    }

    if (!prevState.vendors && this.state.vendors) {
      const felwinters = Object.values(this.state.vendors).flatMap((vendor) =>
        vendor.allItems.filter((i) => i.item.hash === 2672107540)
      );
      if (felwinters.length) {
        this.setState(({ excludeditems }) => ({
          excludeditems: _.uniqBy(
            [...excludeditems, ...felwinters.map((si) => si.item)],
            (i) => i.id
          ),
        }));
      }
    }
  }

  render() {
    const { stores, buckets, defs, isPhonePortrait } = this.props;
    const {
      includeVendors,
      loadingVendors,
      type,
      excludeditems,
      progress,
      allSetTiers,
      activesets,
      fullMode,
      scaleType,
      showAdvanced,
      showHelp,
      lockeditems,
      lockedperks,
      highestsets,
      vendors,
    } = this.state;

    if (!stores.length || !buckets || !defs) {
      return <ShowPageLoading message={t('Loading.Profile')} />;
    }

    const active = this.getSelectedCharacter();

    const i18nItemNames: { [key: string]: string } = _.zipObject(
      ['Helmet', 'Gauntlets', 'Chest', 'Leg', 'ClassItem', 'Artifact', 'Ghost'],
      [45, 46, 47, 48, 49, 38, 39].map((key) => defs.ItemCategory.get(key).title)
    );

    // Armor of each type on a particular character
    // TODO: don't even need to load this much!
    let bucket = loadBucket(active, stores);
    if (includeVendors) {
      bucket = mergeBuckets(bucket, loadVendorsBucket(active, vendors));
    }

    const activePerks = this.calculateActivePerks(active);
    const hasSets = allSetTiers.length > 0;

    const activeHighestSets = getActiveHighestSets(highestsets, activesets);

    return (
      <div className="loadout-builder dim-page itemQuality">
        <div className="character-select">
          <CharacterSelect
            selectedStore={active}
            stores={stores}
            isPhonePortrait={isPhonePortrait}
            onCharacterChanged={this.onSelectedChange}
          />
        </div>
        <LoadoutDrawer />
        <CollapsibleTitle
          defaultCollapsed={true}
          sectionId="lb1-classitems"
          title={t('LB.ShowGear', { class: active.className })}
        >
          <div className="section all-armor">
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
              {t('LB.Vendor')} {loadingVendors && <AppIcon spinning={true} icon={refreshIcon} />}
            </label>
            <div className="loadout-builder-section">
              {_.sortBy(
                bucket[type].filter((i) => i.primStat && i.primStat.value >= 280),
                (i) => (i.quality ? -i.quality.min : 0)
              ).map((item) => (
                <div key={item.index} className="item-container">
                  <div className="item-stats">
                    {item.stats?.map((stat) => (
                      <div
                        key={stat.statHash}
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
          <div className="loadout-builder-section">
            {_.map(lockeditems, (lockeditem, type: ArmorTypes) => (
              <LoadoutBuilderLockPerk
                key={type}
                lockeditem={lockeditem}
                activePerks={activePerks}
                lockedPerks={lockedperks}
                type={type}
                i18nItemNames={i18nItemNames}
                onRemove={this.onRemove}
                onPerkLocked={this.onPerkLocked}
                onItemLocked={this.onItemLocked}
              />
            ))}
          </div>
        </div>
        <div className="section" ng-show="excludeditems.length">
          <p>
            <span>{t('LB.Exclude')}</span> - <small>{t('LB.ExcludeHelp')}</small>
          </p>
          <div className="loadout-builder-section">
            <ExcludeItemsDropTarget onExcluded={this.excludeItem} className="excluded-container">
              <div className="excluded-items">
                {excludeditems.map((excludeditem) => (
                  <div key={excludeditem.index} className="excluded-item">
                    <LoadoutBuilderItem item={excludeditem} />
                    <div
                      className="close"
                      onClick={() => this.onExcludedRemove(excludeditem)}
                      role="button"
                      tabIndex={0}
                    />
                  </div>
                ))}
              </div>
            </ExcludeItemsDropTarget>
          </div>
        </div>
        {progress >= 1 && hasSets && (
          <div className="section">
            {t('LB.FilterSets')} ({t('Stats.Intellect')}/{t('Stats.Discipline')}/
            {t('Stats.Strength')}):{' '}
            <select name="activesets" onChange={this.onActiveSetsChange} value={activesets}>
              {allSetTiers.map((val) => (
                <option key={val} disabled={val.charAt(0) === '-'} value={val}>
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
                        onChange={this.onFullModeChanged}
                        value={fullMode ? 'true' : 'false'}
                      >
                        <option value="false">{t('LB.ProcessingMode.Fast')}</option>
                        <option value="true">{t('LB.ProcessingMode.Full')}</option>
                      </select>{' '}
                      <span>{t('LB.ProcessingMode.ProcessingMode')}</span>
                    </label>
                    <small>
                      {' '}
                      -{' '}
                      {fullMode ? t('LB.ProcessingMode.HelpFull') : t('LB.ProcessingMode.HelpFast')}
                    </small>
                  </p>
                  <p>
                    <label>
                      <select name="scaleType" value={scaleType} onChange={this.onChange}>
                        <option value="scaled">{t('LB.Scaled')}</option>
                        <option value="base">{t('LB.Current')}</option>
                      </select>{' '}
                      <span>{t('LB.LightMode.LightMode')}</span>
                    </label>
                    <small>
                      {' '}
                      - {scaleType === 'scaled' && t('LB.LightMode.HelpScaled')}
                      {scaleType === 'base' && t('LB.LightMode.HelpCurrent')}
                    </small>
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
          </div>
        )}
        {progress >= 1 && !hasSets && (
          <div>
            <p>{t('LB.Missing2')}</p>
          </div>
        )}
        {progress < 1 && hasSets && (
          <div>
            <p>
              {t('LB.Loading')} <AppIcon spinning={true} icon={refreshIcon} />
            </p>
          </div>
        )}
        {progress >= 1 && (
          <ErrorBoundary name="Generated Sets">
            <div>
              {_.map(activeHighestSets, (setType) => (
                <GeneratedSet
                  key={setType.set.setHash}
                  store={active}
                  setType={setType}
                  activesets={activesets}
                  excludeItem={this.excludeItem}
                />
              ))}
            </div>
          </ErrorBoundary>
        )}
      </div>
    );
  }

  private calculateActivePerks = (active: D1Store) => {
    const { stores } = this.props;
    const { vendors, includeVendors } = this.state;

    const perks: { [classType in ClassTypes]: PerkCombination } = {
      [DestinyClass.Warlock]: {
        Helmet: [],
        Gauntlets: [],
        Chest: [],
        Leg: [],
        ClassItem: [],
        Ghost: [],
        Artifact: [],
      },
      [DestinyClass.Titan]: {
        Helmet: [],
        Gauntlets: [],
        Chest: [],
        Leg: [],
        ClassItem: [],
        Ghost: [],
        Artifact: [],
      },
      [DestinyClass.Hunter]: {
        Helmet: [],
        Gauntlets: [],
        Chest: [],
        Leg: [],
        ClassItem: [],
        Ghost: [],
        Artifact: [],
      },
    };

    const vendorPerks: { [classType in ClassTypes]: PerkCombination } = {
      [DestinyClass.Warlock]: {
        Helmet: [],
        Gauntlets: [],
        Chest: [],
        Leg: [],
        ClassItem: [],
        Ghost: [],
        Artifact: [],
      },
      [DestinyClass.Titan]: {
        Helmet: [],
        Gauntlets: [],
        Chest: [],
        Leg: [],
        ClassItem: [],
        Ghost: [],
        Artifact: [],
      },
      [DestinyClass.Hunter]: {
        Helmet: [],
        Gauntlets: [],
        Chest: [],
        Leg: [],
        ClassItem: [],
        Ghost: [],
        Artifact: [],
      },
    };

    function filterItems(items: D1Item[]) {
      return items.filter(
        (item) =>
          item.primStat &&
          item.primStat.statHash === 3897883278 && // has defense hash
          item.talentGrid &&
          item.talentGrid.nodes &&
          item.stats
      );
    }

    let allItems: D1Item[] = [];
    let vendorItems: D1Item[] = [];
    stores.forEach((store) => {
      const items = filterItems(store.items);

      allItems = allItems.concat(items);

      // Build a map of perks
      items.forEach((item) => {
        if (item.classType === DestinyClass.Unknown) {
          allClassTypes.forEach((classType) => {
            perks[classType][item.type] = filterPerks(perks[classType][item.type], item);
          });
        } else {
          perks[item.classType][item.type] = filterPerks(perks[item.classType][item.type], item);
        }
      });
    });

    if (vendors) {
      // Process vendors here
      _.forIn(vendors, (vendor) => {
        const vendItems = filterItems(
          vendor.allItems
            .map((i) => i.item)
            .filter(
              (item) =>
                item.bucket.sort === 'Armor' || item.type === 'Artifact' || item.type === 'Ghost'
            )
        );
        vendorItems = vendorItems.concat(vendItems);

        // Build a map of perks
        vendItems.forEach((item) => {
          if (item.classType === DestinyClass.Unknown) {
            allClassTypes.forEach((classType) => {
              vendorPerks[classType][item.type] = filterPerks(
                vendorPerks[classType][item.type],
                item
              );
            });
          } else {
            vendorPerks[item.classType][item.type] = filterPerks(
              vendorPerks[item.classType][item.type],
              item
            );
          }
        });
      });

      // Remove overlapping perks in allPerks from vendorPerks
      _.forIn(vendorPerks, (perksWithType, classType) => {
        _.forIn(perksWithType, (perkArr, type) => {
          vendorPerks[classType][type] = _.reject(perkArr, (perk) =>
            perks[classType][type].map((i) => i.hash).includes(perk.hash)
          );
        });
      });
    }

    return getActiveBuckets<D1GridNode[]>(
      perks[active.classType],
      vendorPerks[active.classType],
      includeVendors
    );
  };

  private getSelectedCharacter = () =>
    this.state.selectedCharacter || getCurrentStore(this.props.stores)!;

  private calculateSets = () => {
    const active = this.getSelectedCharacter();
    this.cancelToken.cancelled = true;
    this.cancelToken = {
      cancelled: false,
    };
    getSetBucketsStep(
      active,
      loadBucket(active, this.props.stores),
      loadVendorsBucket(active, this.state.vendors),
      this.state.lockeditems,
      this.state.lockedperks,
      this.state.excludeditems,
      this.state.scaleType,
      this.state.includeVendors,
      this.state.fullMode,
      this.cancelToken
    ).then((result) => {
      this.setState({ ...(result as any), progress: 1 });
    });
  };

  private toggleShowHelp = () => this.setState((state) => ({ showHelp: !state.showHelp }));
  private toggleShowAdvanced = () =>
    this.setState((state) => ({ showAdvanced: !state.showAdvanced }));

  private onFullModeChanged: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const fullMode = e.target.value === 'true' ? true : false;
    this.setState({ fullMode, progress: 0 });
  };

  private onChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
    if (e.target.name.length === 0) {
      console.error(new Error('You need to have a name on the form input'));
    }

    if (isInputElement(e.target) && e.target.type === 'checkbox') {
      this.setState({ [e.target.name as any]: e.target.checked, progress: 0 } as any);
    } else {
      this.setState({ [e.target.name as any]: e.target.value, progress: 0 } as any);
    }
  };

  private onActiveSetsChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const activesets = e.target.value;
    this.setState({
      activesets,
    });
  };

  private onSelectedChange = (storeId: string) => {
    // TODO: reset more state??
    this.setState({
      selectedCharacter: this.props.stores.find((s) => s.id === storeId),
      progress: 0,
    });
  };

  private onIncludeVendorsChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const includeVendors = e.target.checked;
    this.setState({ includeVendors, progress: 0 });
  };

  private onPerkLocked = (perk: D1GridNode, type: ArmorTypes, $event: React.MouseEvent) => {
    const { lockedperks } = this.state;
    const lockedPerk = lockedperks[type][perk.hash];
    const activeType = $event.shiftKey
      ? lockedPerk?.lockType === 'and'
        ? 'none'
        : 'and'
      : lockedPerk?.lockType === 'or'
      ? 'none'
      : 'or';

    const newLockedPerks = produce(lockedperks, (lockedperks) => {
      if (activeType === 'none') {
        delete lockedperks[type][perk.hash];
      } else {
        lockedperks[type][perk.hash] = {
          icon: perk.icon,
          description: perk.description,
          lockType: activeType,
        };
      }
    });

    this.setState({ lockedperks: newLockedPerks, progress: 0 });
  };

  private onItemLocked = (item: DimItem) => {
    this.setState(({ lockeditems }) => ({
      lockeditems: { ...lockeditems, [item.type]: item },
      progress: 0,
    }));
  };

  private onRemove = ({ type }: { type: ArmorTypes }) => {
    this.setState(({ lockeditems }) => ({
      lockeditems: { ...lockeditems, [type]: null },
      progress: 0,
    }));
  };

  private excludeItem = (item: D1Item) => {
    this.setState(({ excludeditems }) => ({
      excludeditems: [...excludeditems, item],
      progress: 0,
    }));
  };

  private onExcludedRemove = (item: DimItem) => {
    this.setState(({ excludeditems }) => ({
      excludeditems: excludeditems.filter((excludeditem) => excludeditem.index !== item.index),
      progress: 0,
    }));
  };

  private lockEquipped = () => {
    const store = this.getSelectedCharacter();
    const lockEquippedTypes = [
      'helmet',
      'gauntlets',
      'chest',
      'leg',
      'classitem',
      'artifact',
      'ghost',
    ];
    const items = _.groupBy(
      store.items.filter(
        (item) =>
          item.canBeInLoadout() &&
          item.equipped &&
          lockEquippedTypes.includes(item.type.toLowerCase())
      ),
      (i) => i.type.toLowerCase()
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
        Ghost: nullWithoutStats(items.ghost),
      },
      progress: 0,
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
        Ghost: null,
      },
      activesets: '',
      progress: 0,
    });
  };
}

export default connect(mapStateToProps)(D1LoadoutBuilder);

function isInputElement(element: HTMLElement): element is HTMLInputElement {
  return element.nodeName === 'INPUT';
}

const unwantedPerkHashes = [
  1270552711,
  217480046,
  191086989,
  913963685,
  1034209669,
  1263323987,
  193091484,
  2133116599,
];

function filterPerks(perks: D1GridNode[], item: D1Item) {
  if (!item.talentGrid) {
    return [];
  }
  // ['Infuse', 'Twist Fate', 'Reforge Artifact', 'Reforge Shell', 'Increase Intellect', 'Increase Discipline', 'Increase Strength', 'Deactivate Chroma']
  return _.uniqBy(perks.concat(item.talentGrid.nodes), (node) => node.hash).filter(
    (node) => !unwantedPerkHashes.includes(node.hash)
  );
}
