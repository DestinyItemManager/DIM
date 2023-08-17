import { DestinyAccount } from 'app/accounts/destiny-account';
import ClosableContainer from 'app/dim-ui/ClosableContainer';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { useLoadStores } from 'app/inventory/store/hooks';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import { useD1Definitions } from 'app/manifest/selectors';
import { D1_StatHashes } from 'app/search/d1-known-values';
import { getColor } from 'app/shell/formatters';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import { errorLog } from 'app/utils/log';
import { uniqBy } from 'app/utils/util';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import { produce } from 'immer';
import _ from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import CharacterSelect from '../../dim-ui/CharacterSelect';
import CollapsibleTitle from '../../dim-ui/CollapsibleTitle';
import ErrorBoundary from '../../dim-ui/ErrorBoundary';
import { D1GridNode, D1Item, DimItem } from '../../inventory/item-types';
import { bucketsSelector, storesSelector } from '../../inventory/selectors';
import { D1Store } from '../../inventory/store-types';
import { AppIcon, refreshIcon } from '../../shell/icons';
import { Vendor, loadVendors } from '../vendors/vendor.service';
import ExcludeItemsDropTarget from './ExcludeItemsDropTarget';
import GeneratedSet from './GeneratedSet';
import LoadoutBuilderItem from './LoadoutBuilderItem';
import LoadoutBuilderLockPerk from './LoadoutBuilderLockPerk';
import { getSetBucketsStep } from './calculate';
import './loadout-builder.scss';
import {
  ArmorTypes,
  ClassTypes,
  D1ItemWithNormalStats,
  LockedPerkHash,
  PerkCombination,
  SetType,
} from './types';
import {
  getActiveBuckets,
  getActiveHighestSets,
  loadBucket,
  loadVendorsBucket,
  mergeBuckets,
} from './utils';

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

const initialState: State = {
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

export default function D1LoadoutBuilder({ account }: { account: DestinyAccount }) {
  const buckets = useSelector(bucketsSelector);
  const stores = useSelector(storesSelector) as D1Store[];
  const defs = useD1Definitions();

  const [state, setStateFull] = useState(initialState);
  const setState = (partialState: Partial<State>) =>
    setStateFull((state: State) => ({ ...state, ...partialState }));
  const cancelToken = useRef({ cancelled: false });
  const dispatch = useThunkDispatch();
  const storesLoaded = useLoadStores(account);

  const selectedCharacter = state.selectedCharacter || getCurrentStore(stores)!;

  // TODO: felwinters selectors??
  useEffect(() => {
    if (storesLoaded) {
      // Exclude felwinters if we have them, but only the first time stores load
      const felwinters = stores.flatMap((store) =>
        store.items.filter((i) => i.hash === 2672107540)
      );
      if (felwinters.length) {
        setStateFull((state) => ({
          ...state,
          excludeditems: uniqBy([...state.excludeditems, ...felwinters], (i) => i.id),
        }));
      }
    }
    // Don't depend on storesLoaded because we only want this to run once?
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storesLoaded]);

  useEffect(() => {
    const calculateSets = () => {
      cancelToken.current.cancelled = true;
      cancelToken.current = {
        cancelled: false,
      };
      getSetBucketsStep(
        selectedCharacter,
        loadBucket(selectedCharacter, stores),
        loadVendorsBucket(selectedCharacter, state.vendors),
        state.lockeditems,
        state.lockedperks,
        state.excludeditems,
        state.scaleType,
        state.includeVendors,
        state.fullMode,
        cancelToken.current
      ).then((result) => {
        setState({ ...result, progress: 1 });
      });
    };

    // TODO: replace progress with state field (calculating/done)
    if (defs && stores.length && !state.progress) {
      calculateSets();
    }
  }, [
    defs,
    selectedCharacter,
    state.excludeditems,
    state.fullMode,
    state.includeVendors,
    state.lockeditems,
    state.lockedperks,
    state.progress,
    state.scaleType,
    state.vendors,
    stores,
  ]);

  useEffect(() => {
    if (state.includeVendors && !state.vendors && !state.loadingVendors) {
      setState({ loadingVendors: true });
      dispatch(loadVendors()).then((vendors) => {
        setState({ vendors, loadingVendors: false });
      });
    }
  }, [dispatch, state.includeVendors, state.loadingVendors, state.vendors]);

  const vendorsLoaded = Boolean(state.vendors);

  useEffect(() => {
    if (vendorsLoaded) {
      const felwinters = Object.values(state.vendors!).flatMap((vendor) =>
        vendor.allItems.filter((i) => i.item.hash === 2672107540)
      );
      if (felwinters.length) {
        setStateFull((state) => ({
          ...state,
          excludeditems: uniqBy(
            [...state.excludeditems, ...felwinters.map((si) => si.item)],
            (i) => i.id
          ),
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorsLoaded]);

  const activePerks = useMemo(() => {
    const vendors = state.vendors;
    const includeVendors = state.includeVendors;

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

    function filterItems(items: readonly D1Item[]) {
      return items.filter(
        (item) =>
          item.primaryStat?.statHash === D1_StatHashes.Defense &&
          item.talentGrid?.nodes &&
          item.stats
      );
    }

    let allItems: D1Item[] = [];
    let vendorItems: D1Item[] = [];
    for (const store of stores) {
      const items = filterItems(store.items);

      allItems = allItems.concat(items);

      // Build a map of perks
      for (const item of items) {
        const itemType = item.type as ArmorTypes;
        if (item.classType === DestinyClass.Unknown) {
          for (const classType of allClassTypes) {
            perks[classType][itemType] = filterPerks(perks[classType][itemType], item);
          }
        } else if (item.classType !== DestinyClass.Classified) {
          perks[item.classType][itemType] = filterPerks(perks[item.classType][itemType], item);
        }
      }
    }

    if (vendors) {
      // Process vendors here
      for (const vendor of Object.values(vendors)) {
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
        for (const item of vendItems) {
          const itemType = item.type as ArmorTypes;
          if (item.classType === DestinyClass.Unknown) {
            for (const classType of allClassTypes) {
              vendorPerks[classType][itemType] = filterPerks(
                vendorPerks[classType][itemType],
                item
              );
            }
          } else if (item.classType !== DestinyClass.Classified) {
            vendorPerks[item.classType][itemType] = filterPerks(
              vendorPerks[item.classType][itemType],
              item
            );
          }
        }
      }

      // Remove overlapping perks in allPerks from vendorPerks
      for (const [classType, perksWithType] of Object.entries(vendorPerks) as unknown as [
        ClassTypes,
        PerkCombination,
      ][]) {
        for (const [type, perkArr] of Object.entries(perksWithType) as unknown as [
          ArmorTypes,
          D1GridNode[],
        ][]) {
          vendorPerks[classType][type] = _.reject(perkArr, (perk) =>
            perks[classType][type].map((i) => i.hash).includes(perk.hash)
          );
        }
      }
    }

    return getActiveBuckets<D1GridNode[]>(
      perks[selectedCharacter.classType as ClassTypes],
      vendorPerks[selectedCharacter.classType as ClassTypes],
      includeVendors
    );
  }, [selectedCharacter.classType, state.vendors, state.includeVendors, stores]);

  const toggleShowHelp = () => setStateFull((state) => ({ ...state, showHelp: !state.showHelp }));
  const toggleShowAdvanced = () =>
    setStateFull((state) => ({ ...state, showAdvanced: !state.showAdvanced }));

  const onFullModeChanged: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const fullMode = e.target.value === 'true';
    setState({ fullMode, progress: 0 });
  };

  const onChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    if (e.target.name.length === 0) {
      errorLog('loadout optimizer', new Error('You need to have a name on the form input'));
    }

    // https://github.com/Microsoft/TypeScript/issues/13948
    setState({
      [e.target.name as 'type' | 'scaleType']: e.target.value,
      progress: 0,
    } as unknown as Pick<State, keyof State>);
  };

  const onActiveSetsChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const activesets = e.target.value;
    setState({
      activesets,
    });
  };

  const onSelectedChange = (storeId: string) => {
    // TODO: reset more state??
    setState({
      selectedCharacter: stores.find((s) => s.id === storeId),
      progress: 0,
    });
  };

  const onIncludeVendorsChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const includeVendors = e.target.checked;
    setState({ includeVendors, progress: 0 });
  };

  const onPerkLocked = (perk: D1GridNode, type: ArmorTypes, $event: React.MouseEvent) => {
    const { lockedperks } = state;
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

    setState({ lockedperks: newLockedPerks, progress: 0 });
  };

  const onItemLocked = (item: DimItem) => {
    setStateFull((state) => ({
      ...state,
      lockeditems: { ...state.lockeditems, [item.type]: item },
      progress: 0,
    }));
  };

  const onRemove = ({ type }: { type: ArmorTypes }) => {
    setStateFull((state) => ({
      ...state,
      lockeditems: { ...state.lockeditems, [type]: null },
      progress: 0,
    }));
  };

  const excludeItem = (item: D1Item) => {
    setStateFull((state) => ({
      ...state,
      excludeditems: [...state.excludeditems, item],
      progress: 0,
    }));
  };

  const onExcludedRemove = (item: DimItem) => {
    setStateFull((state) => ({
      ...state,
      excludeditems: state.excludeditems.filter(
        (excludeditem) => excludeditem.index !== item.index
      ),
      progress: 0,
    }));
  };

  const lockEquipped = () => {
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
      selectedCharacter.items.filter(
        (item) =>
          itemCanBeInLoadout(item) &&
          item.equipped &&
          lockEquippedTypes.includes(item.type.toLowerCase())
      ),
      (i) => i.type.toLowerCase()
    );

    function nullWithoutStats(items: DimItem[]) {
      return items[0].stats ? (items[0] as D1Item) : null;
    }

    // Do not lock items with no stats
    setState({
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

  const clearLocked = () => {
    setState({
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
  } = state;

  if (!stores.length || !buckets || !defs) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  const i18nItemNames: { [key: string]: string } = _.zipObject(
    ['Helmet', 'Gauntlets', 'Chest', 'Leg', 'ClassItem', 'Artifact', 'Ghost'],
    [
      ItemCategoryHashes.Helmets,
      ItemCategoryHashes.Arms,
      ItemCategoryHashes.Chest,
      ItemCategoryHashes.Legs,
      ItemCategoryHashes.ClassItems,
      38, // D1 Artifact
      ItemCategoryHashes.Ghost,
    ].map((key) => defs.ItemCategory.get(key).title)
  );

  // Armor of each type on a particular character
  // TODO: don't even need to load this much!
  let bucket = loadBucket(selectedCharacter, stores);
  if (includeVendors) {
    bucket = mergeBuckets(bucket, loadVendorsBucket(selectedCharacter, vendors));
  }

  const hasSets = allSetTiers.length > 0;

  const activeHighestSets = getActiveHighestSets(highestsets, activesets);

  return (
    <PageWithMenu className="itemQuality">
      <PageWithMenu.Menu>
        <div className="character-select">
          <CharacterSelect
            selectedStore={selectedCharacter}
            stores={stores}
            onCharacterChanged={onSelectedChange}
          />
        </div>
      </PageWithMenu.Menu>
      <PageWithMenu.Contents className="loadout-builder">
        <CollapsibleTitle
          defaultCollapsed={true}
          sectionId="lb1-classitems"
          title={t('LB.ShowGear', { class: selectedCharacter.className })}
        >
          <div className="section all-armor">
            {/* TODO: break into its own component */}
            <span>{t('Bucket.Armor')}</span>:{' '}
            <select name="type" value={type} onChange={onChange}>
              {Object.entries(i18nItemNames).map(([type, name]) => (
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
                onChange={onIncludeVendorsChange}
              />{' '}
              {t('LB.Vendor')} {loadingVendors && <AppIcon spinning={true} icon={refreshIcon} />}
            </label>
            <div className="loadout-builder-section">
              {_.sortBy(
                bucket[type].filter((i) => i.power >= 280),
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
                    <LoadoutBuilderItem shiftClickCallback={excludeItem} item={item} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleTitle>
        <div className="section">
          <p>
            <span className="dim-button locked-button" onClick={lockEquipped}>
              {t('LB.LockEquipped')}
            </span>
            <span className="dim-button locked-button" onClick={clearLocked}>
              {t('LB.ClearLocked')}
            </span>
            <span>{t('LB.Locked')}</span> - <small>{t('LB.LockedHelp')}</small>
          </p>
          <div className="loadout-builder-section">
            {Object.entries(lockeditems).map(([type, lockeditem]) => (
              <LoadoutBuilderLockPerk
                key={type}
                lockeditem={lockeditem}
                activePerks={activePerks}
                lockedPerks={lockedperks}
                type={type as ArmorTypes}
                i18nItemNames={i18nItemNames}
                onRemove={onRemove}
                onPerkLocked={onPerkLocked}
                onItemLocked={onItemLocked}
              />
            ))}
          </div>
        </div>
        {excludeditems.length > 0 && (
          <div className="section">
            <p>
              <span>{t('LB.Exclude')}</span> - <small>{t('LB.ExcludeHelp')}</small>
            </p>
            <div className="loadout-builder-section">
              <ExcludeItemsDropTarget onExcluded={excludeItem} className="excluded-container">
                <div className="excluded-items">
                  {excludeditems.map((excludeditem) => (
                    <ClosableContainer
                      key={excludeditem.index}
                      className="excluded-item"
                      onClose={() => onExcludedRemove(excludeditem)}
                    >
                      <LoadoutBuilderItem item={excludeditem} />
                    </ClosableContainer>
                  ))}
                </div>
              </ExcludeItemsDropTarget>
            </div>
          </div>
        )}
        {progress >= 1 && hasSets && (
          <div className="section">
            {t('LB.FilterSets')} ({t('Stats.Intellect')}/{t('Stats.Discipline')}/
            {t('Stats.Strength')}):{' '}
            <select name="activesets" onChange={onActiveSetsChange} value={activesets}>
              {allSetTiers.map((val) => (
                <option key={val} disabled={val.startsWith('-')} value={val}>
                  {val}
                </option>
              ))}
            </select>{' '}
            <span className="dim-button" onClick={toggleShowAdvanced}>
              {t('LB.AdvancedOptions')}
            </span>{' '}
            <span className="dim-button" onClick={toggleShowHelp}>
              {t('LB.Help.Help')}
            </span>
            <span>
              {showAdvanced && (
                <div>
                  <p>
                    <label>
                      <select
                        name="fullMode"
                        onChange={onFullModeChanged}
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
                      <select name="scaleType" value={scaleType} onChange={onChange}>
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
              {activeHighestSets.map((setType) => (
                <GeneratedSet
                  key={setType.set.setHash}
                  store={selectedCharacter}
                  setType={setType}
                  activesets={activesets}
                  excludeItem={excludeItem}
                />
              ))}
            </div>
          </ErrorBoundary>
        )}
      </PageWithMenu.Contents>
    </PageWithMenu>
  );
}

const unwantedPerkHashes = [
  1270552711, 217480046, 191086989, 913963685, 1034209669, 1263323987, 193091484, 2133116599,
];

function filterPerks(perks: D1GridNode[], item: D1Item) {
  if (!item.talentGrid) {
    return [];
  }
  // ['Infuse', 'Twist Fate', 'Reforge Artifact', 'Reforge Shell', 'Increase Intellect', 'Increase Discipline', 'Increase Strength', 'Deactivate Chroma']
  return uniqBy(perks.concat(item.talentGrid.nodes), (node) => node.hash).filter(
    (node) => !unwantedPerkHashes.includes(node.hash)
  );
}
