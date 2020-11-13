import { recentSearchesSelector } from 'app/dim-api/selectors';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import Dropdown, { Option } from 'app/dim-ui/Dropdown';
import { itemPop } from 'app/dim-ui/scroll';
import { startFarming, stopFarming } from 'app/farming/actions';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { allItemsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import ItemActionsDropdown from 'app/item-actions/ItemActionsDropdown';
import MaxlightButton from 'app/loadout/MaxlightButton';
import { searchFiltersConfigSelector } from 'app/search/search-filter';
import { setSearchQuery } from 'app/shell/actions';
import { AppIcon, searchIcon } from 'app/shell/icons';
import _ from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import styles from './FarmingView.m.scss';

type Props = {
  store: DimStore;
};

const hasClassifiedSelector = createSelector(allItemsSelector, (allItems) =>
  allItems.some(
    (i) =>
      i.classified &&
      (i.location.sort === 'Weapons' || i.location.sort === 'Armor' || i.type === 'Ghost')
  )
);

export default function FarmingView({ store }: Props) {
  const [isFarming, setIsFarming] = useState(false);

  const allItems = useSelector(allItemsSelector);
  const filters = useSelector(searchFiltersConfigSelector);
  const hasClassified = useSelector(hasClassifiedSelector);
  const savedSearches = useSelector(recentSearchesSelector).filter(({ saved }) => saved);
  const [query, setQuery] = useState<string>(savedSearches?.[0]?.query);
  const options: Option[] = savedSearches.map(({ query }) => ({
    key: query,
    content: query,
    onSelected: () => setQuery(query),
  }));

  const filter = useMemo(() => query && filters(query), [filters, query]);
  const items = useMemo(
    () => _.sortBy(filter ? allItems.filter(filter) : allItems, ({ id }) => -id),
    [allItems, filter]
  );

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch((isFarming ? startFarming : stopFarming)(store.id));
  }, [dispatch, store, isFarming]);

  items.length = Math.min(items.length, 8);

  return (
    <CollapsibleTitle
      title={t('ActiveMode.Farming')}
      sectionId={'active-filter'}
      className={styles.collapseTitle}
      defaultCollapsed={true}
    >
      <div className="dim-button bucket-button" onClick={() => setIsFarming(!isFarming)}>
        {!isFarming ? t('ActiveMode.FarmingStart') : t('ActiveMode.FarmingStart')}
      </div>
      <div className="dim-button bucket-button">
        <MaxlightButton
          allItems={allItems}
          dimStore={store}
          hasClassified={hasClassified}
          hideIcon={true}
        />
      </div>
      {options.length > 0 && (
        <div className={styles.options}>
          <Dropdown options={options}>{t('ActiveMode.ChangeFilter')}</Dropdown>
          <ItemActionsDropdown filteredItems={items} searchActive={Boolean(query.length)} />
          <div className={styles.applySearch} onClick={() => dispatch(setSearchQuery(query))}>
            <AppIcon icon={searchIcon} />
          </div>
        </div>
      )}
      <div className={styles.matchedItems}>
        {options.length ? (
          items.map((item) => (
            <ConnectedInventoryItem
              key={item.index}
              id={'farm-' + item.index}
              item={item}
              onClick={() => itemPop(item)}
            />
          ))
        ) : (
          <div className={styles.noSearches}>
            <div className={styles.message}>{t('ActiveMode.NoSearches')}</div>
          </div>
        )}
      </div>
    </CollapsibleTitle>
  );
}
