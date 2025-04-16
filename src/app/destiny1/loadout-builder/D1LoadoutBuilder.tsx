import { DestinyAccount } from 'app/accounts/destiny-account';
import ClosableContainer from 'app/dim-ui/ClosableContainer';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import Switch from 'app/dim-ui/Switch';
import { t } from 'app/i18next-t';
import { useLoadStores } from 'app/inventory/store/hooks';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import { useD1Definitions } from 'app/manifest/selectors';
import { D1_StatHashes, D1BucketHashes } from 'app/search/d1-known-values';
import { getD1QualityColor } from 'app/shell/formatters';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { uniqBy } from 'app/utils/collections';
import { compareBy, reverseComparator } from 'app/utils/comparators';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import { errorLog } from 'app/utils/log';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { BucketHashes, ItemCategoryHashes } from 'data/d2/generated-enums';
import { produce } from 'immer';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import CharacterSelect from '../../dim-ui/CharacterSelect';
import CollapsibleTitle from '../../dim-ui/CollapsibleTitle';
import ErrorBoundary from '../../dim-ui/ErrorBoundary';
import { D1GridNode, D1Item, DimItem } from '../../inventory/item-types';
import { bucketsSelector, sortedStoresSelector } from '../../inventory/selectors';
import { D1Store } from '../../inventory/store-types';
import { AppIcon, refreshIcon } from '../../shell/icons';
import { loadVendors, Vendor } from '../vendors/vendor.service';
import styles from './D1LoadoutBuilder.m.scss';
import ExcludeItemsDropTarget from './ExcludeItemsDropTarget';
import GeneratedSet from './GeneratedSet';
import LoadoutBuilderItem from './LoadoutBuilderItem';
import LoadoutBuilderLockPerk from './LoadoutBuilderLockPerk';
import { getSetBucketsStep } from './calculate';
import {
  ArmorTypes,
  ClassTypes,
  D1ItemWithNormalStats,
  LockedPerkHash,
  PerkCombination,
  SetType,
} from './types';
import { getActiveHighestSets, loadBucket, loadVendorsBucket, mergeBuckets } from './utils';

interface State {
  selectedCharacter?: D1Store;
  excludeditems: D1Item[];
  lockedperks: { [armorType in ArmorTypes]: LockedPerkHash };
  activesets: string;
  scaleType: 'base' | 'scaled';
  progress: number;
  fullMode: boolean;
  includeVendors: boolean;
  allSetTiers: string[];
  highestsets: { [setHash: number]: SetType };
  lockeditems: { [armorType in ArmorTypes]: D1ItemWithNormalStats | null };
  vendors?: {
    [vendorHash: number]: Vendor;
  };
  loadingVendors: boolean;
}

export const d1ArmorTypes = [
  BucketHashes.Helmet,
  BucketHashes.Gauntlets,
  BucketHashes.ChestArmor,
  BucketHashes.LegArmor,
  BucketHashes.ClassArmor,
  D1BucketHashes.Artifact,
  BucketHashes.Ghost,
] as ArmorTypes[];
const allClassTypes: ClassTypes[] = [DestinyClass.Titan, DestinyClass.Warlock, DestinyClass.Hunter];

const initialState: State = {
  activesets: '5/5/2',
  scaleType: 'scaled',
  progress: 0,
  fullMode: false,
  includeVendors: false,
  loadingVendors: false,
  allSetTiers: [],
  highestsets: {},
  excludeditems: [],
  lockeditems: {
    [BucketHashes.Helmet]: null,
    [BucketHashes.Gauntlets]: null,
    [BucketHashes.ChestArmor]: null,
    [BucketHashes.LegArmor]: null,
    [BucketHashes.ClassArmor]: null,
    [D1BucketHashes.Artifact]: null,
    [BucketHashes.Ghost]: null,
  },
  lockedperks: {
    [BucketHashes.Helmet]: {},
    [BucketHashes.Gauntlets]: {},
    [BucketHashes.ChestArmor]: {},
    [BucketHashes.LegArmor]: {},
    [BucketHashes.ClassArmor]: {},
    [D1BucketHashes.Artifact]: {},
    [BucketHashes.Ghost]: {},
  },
};

const unwantedPerkHashes = [
  1270552711, // Infuse
  217480046, // Twist Fate
  191086989, // Reforge Artifact
  913963685, // Reforge Shell
  1034209669, // Increase Intellect
  1263323987, // Increase Discipline
  193091484, // Increase Strength
  2133116599, // Deactivate Chroma
];

export default function D1LoadoutBuilder({ account }: { account: DestinyAccount }) {
  const buckets = useSelector(bucketsSelector);
  const stores = useSelector(sortedStoresSelector) as D1Store[];
  const defs = useD1Definitions();

  const [state, setStateFull] = useState(initialState);
  const setState = (partialState: Partial<State>) =>
    setStateFull((state: State) => ({ ...state, ...partialState }));
  const cancelToken = useRef({ cancelled: false });
  const dispatch = useThunkDispatch();
  const storesLoaded = useLoadStores(account);

  const {
    includeVendors,
    loadingVendors,
    excludeditems,
    progress,
    allSetTiers,
    fullMode,
    scaleType,
    activesets,
    lockeditems,
    lockedperks,
    highestsets,
    vendors,
  } = state;

  const selectedCharacter = state.selectedCharacter || getCurrentStore(stores);

  useEffect(() => {
    if (storesLoaded) {
      // Exclude felwinters if we have them, but only the first time stores load
      const felwinters = stores.flatMap((store) =>
        store.items.filter((i) => i.hash === 2672107540),
      );
      if (felwinters.length) {
        setStateFull((state) => ({
          ...state,
          excludeditems: uniqBy([...state.excludeditems, ...felwinters], (i) => i.id),
        }));
      }
    }
    // Only depend on storesLoaded because we only want this to run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storesLoaded]);

  useEffect(() => {
    // TODO: replace progress with state field (calculating/done)
    if (defs && selectedCharacter && stores.length && !progress) {
      (async () => {
        cancelToken.current.cancelled = true;
        cancelToken.current = {
          cancelled: false,
        };
        const result = await getSetBucketsStep(
          defs,
          loadBucket(selectedCharacter, stores),
          loadVendorsBucket(selectedCharacter, vendors),
          lockeditems,
          lockedperks,
          excludeditems,
          scaleType,
          includeVendors,
          fullMode,
          cancelToken.current,
        );
        setState({ ...result, progress: 1 });
      })();
    }
  }, [
    defs,
    selectedCharacter,
    excludeditems,
    fullMode,
    includeVendors,
    lockeditems,
    lockedperks,
    progress,
    scaleType,
    vendors,
    stores,
  ]);

  useEffect(() => {
    if (includeVendors && !vendors && !loadingVendors) {
      setState({ loadingVendors: true });
      dispatch(loadVendors()).then((vendors) => {
        setState({ vendors, loadingVendors: false });
      });
    }
  }, [dispatch, includeVendors, loadingVendors, vendors]);

  const vendorsLoaded = Boolean(vendors);

  useEffect(() => {
    if (vendorsLoaded) {
      const felwinters = Object.values(vendors!).flatMap((vendor) =>
        vendor.allItems.filter((i) => i.item.hash === 2672107540),
      );
      if (felwinters.length) {
        setState({
          excludeditems: uniqBy(
            [...excludeditems, ...felwinters.map((si) => si.item)],
            (i) => i.id,
          ),
        });
      }
    }
    // Only depend on vendorsLoaded because we only want this to run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorsLoaded]);

  const activePerks = useActivePerks({
    classType: selectedCharacter?.classType,
    vendors,
    includeVendors,
    stores,
  });

  const onFullModeChanged: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const fullMode = e.target.value === 'true';
    setState({ fullMode, progress: 0 });
  };

  const onChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    if (e.target.name.length === 0) {
      errorLog('loadout optimizer', new Error('You need to have a name on the form input'));
    }

    setState({
      [e.target.name]: e.target.value,
      progress: 0,
    });
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

  const onIncludeVendorsChange = (includeVendors: boolean) => {
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
      lockeditems: { ...state.lockeditems, [item.bucket.hash]: item },
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
        (excludeditem) => excludeditem.index !== item.index,
      ),
      progress: 0,
    }));
  };

  const lockEquipped = () => {
    const items = Map.groupBy(
      selectedCharacter!.items.filter(
        (item) =>
          itemCanBeInLoadout(item) && item.equipped && d1ArmorTypes.includes(item.bucket.hash),
      ),
      (i) => i.bucket.hash as ArmorTypes,
    );

    function nullWithoutStats(items: DimItem[] | undefined) {
      return items?.[0].stats ? (items[0] as D1Item) : null;
    }

    // Do not lock items with no stats
    setState({
      lockeditems: {
        [BucketHashes.Helmet]: nullWithoutStats(items.get(BucketHashes.Helmet)),
        [BucketHashes.Gauntlets]: nullWithoutStats(items.get(BucketHashes.Gauntlets)),
        [BucketHashes.ChestArmor]: nullWithoutStats(items.get(BucketHashes.ChestArmor)),
        [BucketHashes.LegArmor]: nullWithoutStats(items.get(BucketHashes.LegArmor)),
        [BucketHashes.ClassArmor]: nullWithoutStats(items.get(BucketHashes.ClassArmor)),
        [D1BucketHashes.Artifact]: nullWithoutStats(items.get(D1BucketHashes.Artifact)),
        [BucketHashes.Ghost]: nullWithoutStats(items.get(BucketHashes.Ghost)),
      },
      progress: 0,
    });
  };

  const clearLocked = () => {
    setState({
      lockeditems: {
        [BucketHashes.Helmet]: null,
        [BucketHashes.Gauntlets]: null,
        [BucketHashes.ChestArmor]: null,
        [BucketHashes.LegArmor]: null,
        [BucketHashes.ClassArmor]: null,
        [D1BucketHashes.Artifact]: null,
        [BucketHashes.Ghost]: null,
      },
      activesets: '',
      progress: 0,
    });
  };

  if (!selectedCharacter || !stores.length || !buckets || !defs || !activePerks) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  const hasSets = allSetTiers.length > 0;

  const activeHighestSets = getActiveHighestSets(highestsets, activesets);

  const i18nItemNames = Object.fromEntries(
    d1ArmorTypes.map((type, i) => [
      type,
      defs.ItemCategory.get(
        [
          ItemCategoryHashes.Helmets,
          ItemCategoryHashes.Arms,
          ItemCategoryHashes.Chest,
          ItemCategoryHashes.Legs,
          ItemCategoryHashes.ClassItems,
          38, // D1 Artifact
          ItemCategoryHashes.Ghost,
        ][i],
      ).title,
    ]),
  ) as { [key in ArmorTypes]: string };

  return (
    <PageWithMenu className="itemQuality">
      <PageWithMenu.Menu>
        <CharacterSelect
          selectedStore={selectedCharacter}
          stores={stores}
          onCharacterChanged={onSelectedChange}
        />
      </PageWithMenu.Menu>
      <PageWithMenu.Contents>
        <CollapsibleTitle
          defaultCollapsed={true}
          sectionId="lb1-classitems"
          title={t('LB.ShowGear', { class: selectedCharacter.className })}
        >
          <div className={styles.section}>
            <ArmorForClass
              i18nItemNames={i18nItemNames}
              selectedCharacter={selectedCharacter}
              stores={stores}
              includeVendors={includeVendors}
              loadingVendors={loadingVendors}
              onIncludeVendorsChange={onIncludeVendorsChange}
              excludeItem={excludeItem}
            />
          </div>
        </CollapsibleTitle>
        <div className={styles.section}>
          <div className={styles.controls}>
            <button type="button" className="dim-button" onClick={lockEquipped}>
              {t('LB.LockEquipped')}
            </button>
            <button type="button" className="dim-button" onClick={clearLocked}>
              {t('LB.ClearLocked')}
            </button>
            <span>
              {t('LB.Locked')} - <small>{t('LB.LockedHelp')}</small>
            </span>
          </div>
          <div className={styles.itemRow}>
            {Object.entries(lockeditems).map(([type, lockeditem]) => (
              <LoadoutBuilderLockPerk
                key={type}
                lockeditem={lockeditem}
                activePerks={activePerks}
                lockedPerks={lockedperks}
                type={parseInt(type, 10) as ArmorTypes}
                i18nItemNames={i18nItemNames}
                onRemove={onRemove}
                onPerkLocked={onPerkLocked}
                onItemLocked={onItemLocked}
              />
            ))}
          </div>
        </div>
        {excludeditems.length > 0 && (
          <div className={styles.section}>
            <p>
              <span>{t('LB.Exclude')}</span> - <small>{t('LB.ExcludeHelp')}</small>
            </p>
            <div className={styles.itemRow}>
              <ExcludeItemsDropTarget onExcluded={excludeItem} className={styles.excludedItems}>
                {excludeditems.map((excludeditem) => (
                  <ClosableContainer
                    key={excludeditem.index}
                    onClose={() => onExcludedRemove(excludeditem)}
                  >
                    <LoadoutBuilderItem item={excludeditem} />
                  </ClosableContainer>
                ))}
              </ExcludeItemsDropTarget>
            </div>
          </div>
        )}
        {progress >= 1 && hasSets && (
          <SetControls
            allSetTiers={allSetTiers}
            activesets={activesets}
            fullMode={fullMode}
            scaleType={scaleType}
            onActiveSetsChange={onActiveSetsChange}
            onFullModeChanged={onFullModeChanged}
            onChangeScaleType={onChange}
          />
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
            <div className={styles.section}>
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

function SetControls({
  allSetTiers,
  activesets,
  fullMode,
  scaleType,
  onActiveSetsChange,
  onFullModeChanged,
  onChangeScaleType,
}: {
  allSetTiers: string[];
  activesets: string;
  fullMode: boolean;
  scaleType: 'base' | 'scaled';
  onActiveSetsChange: React.ChangeEventHandler<HTMLSelectElement>;
  onFullModeChanged: React.ChangeEventHandler<HTMLSelectElement>;
  onChangeScaleType: React.ChangeEventHandler<HTMLSelectElement>;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const toggleShowHelp = () => setShowHelp((show) => !show);
  const toggleShowAdvanced = () => setShowAdvanced((show) => !show);

  return (
    <div className={styles.section}>
      <div className={styles.controls}>
        <div>
          <span>
            {t('LB.FilterSets')} ({t('Stats.Intellect')}/{t('Stats.Discipline')}/
            {t('Stats.Strength')}):{' '}
          </span>
          <select name="activesets" onChange={onActiveSetsChange} value={activesets}>
            {allSetTiers.map((val) => (
              <option key={val} disabled={val.startsWith('-')} value={val}>
                {val}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="dim-button" onClick={toggleShowAdvanced}>
          {t('LB.AdvancedOptions')}
        </button>
        <button type="button" className="dim-button" onClick={toggleShowHelp}>
          {t('LB.Help.Help')}
        </button>
      </div>
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
                - {fullMode ? t('LB.ProcessingMode.HelpFull') : t('LB.ProcessingMode.HelpFast')}
              </small>
            </p>
            <p>
              <label>
                <select name="scaleType" value={scaleType} onChange={onChangeScaleType}>
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
                  <div className={clsx(styles.example, styles.or)}>- {t('LB.Help.Or')}</div>
                </li>
                <li>
                  <div className={clsx(styles.example, styles.and)}>- {t('LB.Help.And')}</div>
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
  );
}

function ArmorForClass({
  i18nItemNames,
  selectedCharacter,
  stores,
  vendors,
  includeVendors,
  loadingVendors,
  onIncludeVendorsChange,
  excludeItem,
}: {
  i18nItemNames: { [key in ArmorTypes]: string };
  selectedCharacter: D1Store;
  stores: D1Store[];
  vendors?: {
    [vendorHash: number]: Vendor;
  };
  includeVendors: boolean;
  loadingVendors: boolean;
  onIncludeVendorsChange: (includeVendors: boolean) => void;
  excludeItem: (item: D1Item) => void;
}) {
  const [type, setType] = useState<ArmorTypes>(BucketHashes.Helmet);

  // Armor of each type on a particular character
  // TODO: don't even need to load this much!
  let bucket = loadBucket(selectedCharacter, stores);
  if (includeVendors) {
    bucket = mergeBuckets(bucket, loadVendorsBucket(selectedCharacter, vendors));
  }

  const items = bucket[type]
    .filter((i) => i.power >= 280)
    .sort(reverseComparator(compareBy((i) => i.quality?.min ?? 0)));

  return (
    <>
      <div className={styles.controls}>
        <div>
          {/* TODO: break into its own component */}
          <span>{t('Bucket.Armor')}:</span>{' '}
          <select name="type" value={type} onChange={(e) => setType(parseInt(e.target.value, 10))}>
            {d1ArmorTypes.map((type) => (
              <option key={type} value={type}>
                {i18nItemNames[type]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Switch
            name="includeVendors"
            checked={includeVendors}
            onChange={onIncludeVendorsChange}
          />
          <label htmlFor="includeVendors">{t('LB.Vendor')}</label>
        </div>
        {loadingVendors && <AppIcon spinning={true} icon={refreshIcon} />}
      </div>
      <div className={styles.itemRow}>
        {items.map((item) => (
          <div key={item.index}>
            {item.stats?.map((stat) => (
              <div
                key={stat.statHash}
                style={getD1QualityColor(
                  item.normalStats![stat.statHash].qualityPercentage,
                  'color',
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
            <LoadoutBuilderItem shiftClickCallback={excludeItem} item={item} />
          </div>
        ))}
      </div>
    </>
  );
}

function filterPerks(perks: D1GridNode[], item: D1Item) {
  if (!item.talentGrid) {
    return [];
  }
  return uniqBy(perks.concat(item.talentGrid.nodes), (node) => node.hash).filter(
    (node) => !unwantedPerkHashes.includes(node.hash),
  );
}

function useActivePerks({
  classType,
  vendors,
  includeVendors,
  stores,
}: {
  classType: DestinyClass | undefined;
  vendors:
    | {
        [vendorHash: number]: Vendor;
      }
    | undefined;
  includeVendors: boolean;
  stores: D1Store[];
}) {
  return useMemo(() => {
    if (classType === undefined) {
      return undefined;
    }

    const emptyPerks = {
      [BucketHashes.Helmet]: [],
      [BucketHashes.Gauntlets]: [],
      [BucketHashes.ChestArmor]: [],
      [BucketHashes.LegArmor]: [],
      [BucketHashes.ClassArmor]: [],
      [D1BucketHashes.Artifact]: [],
      [BucketHashes.Ghost]: [],
    };
    const perks: { [classType in ClassTypes]: PerkCombination } = {
      [DestinyClass.Warlock]: structuredClone(emptyPerks),
      [DestinyClass.Titan]: structuredClone(emptyPerks),
      [DestinyClass.Hunter]: structuredClone(emptyPerks),
    };

    const vendorPerks: { [classType in ClassTypes]: PerkCombination } = structuredClone(perks);

    function filterItems(items: readonly D1Item[]) {
      return items.filter(
        (item) =>
          item.primaryStat?.statHash === D1_StatHashes.Defense &&
          item.talentGrid?.nodes &&
          item.stats,
      );
    }

    let allItems: D1Item[] = [];
    let vendorItems: D1Item[] = [];
    for (const store of stores) {
      const items = filterItems(store.items);

      allItems = allItems.concat(items);

      // Build a map of perks
      for (const item of items) {
        const itemType = item.bucket.hash as ArmorTypes;
        if (item.classType === DestinyClass.Unknown) {
          for (const classType of allClassTypes) {
            perks[classType][itemType] = filterPerks(perks[classType][itemType], item);
          }
        } else if (item.classType !== DestinyClass.Classified) {
          perks[item.classType][itemType] = filterPerks(perks[item.classType][itemType], item);
        }
      }
    }

    if (vendors && includeVendors) {
      // Process vendors here
      for (const vendor of Object.values(vendors)) {
        const vendItems = filterItems(
          vendor.allItems
            .map((i) => i.item)
            .filter(
              (item) =>
                item.bucket.sort === 'Armor' ||
                item.bucket.hash === D1BucketHashes.Artifact ||
                item.bucket.hash === BucketHashes.Ghost,
            ),
        );
        vendorItems = vendorItems.concat(vendItems);

        // Build a map of perks
        for (const item of vendItems) {
          const itemType = item.bucket.hash as ArmorTypes;
          if (item.classType === DestinyClass.Unknown) {
            for (const classType of allClassTypes) {
              vendorPerks[classType][itemType] = filterPerks(
                vendorPerks[classType][itemType],
                item,
              );
            }
          } else if (item.classType !== DestinyClass.Classified) {
            vendorPerks[item.classType][itemType] = filterPerks(
              vendorPerks[item.classType][itemType],
              item,
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
          vendorPerks[classType][type] = perkArr.filter(
            (perk) => !perks[classType][type].map((i) => i.hash).includes(perk.hash),
          );
        }
      }
    }

    return mergeBuckets<D1GridNode[]>(
      perks[classType as ClassTypes],
      vendorPerks[classType as ClassTypes],
    );
  }, [classType, vendors, includeVendors, stores]);
}
