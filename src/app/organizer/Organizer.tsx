import { DestinyAccount } from 'app/accounts/destiny-account';
import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { storesSelector } from 'app/inventory/selectors';
import { useLoadStores } from 'app/inventory/store/hooks';
import { setSearchQuery } from 'app/shell/actions';
import { querySelector, useIsPhonePortrait } from 'app/shell/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router';
import ItemTable from './ItemTable';
import ItemTypeSelector, { getSelectionTree, ItemCategoryTreeNode } from './ItemTypeSelector';
import styles from './Organizer.m.scss';

interface Props {
  account: DestinyAccount;
}

/**
 * Given a list of item category hashes and a tree of categories, translate the hashes
 * into a list of ItemCategoryTreeNodes.
 */
function drillToSelection(
  selectionTree: ItemCategoryTreeNode | undefined,
  selectedItemCategoryHashes: number[]
): ItemCategoryTreeNode[] {
  const selectedItemCategoryHash = selectedItemCategoryHashes[0];

  if (
    !selectionTree ||
    selectedItemCategoryHash === undefined ||
    selectionTree.itemCategoryHash !== selectedItemCategoryHash
  ) {
    return [];
  }

  if (selectionTree.subCategories && selectedItemCategoryHashes.length) {
    for (const category of selectionTree.subCategories) {
      const subselection = drillToSelection(category, selectedItemCategoryHashes.slice(1));
      if (subselection.length) {
        return [selectionTree, ...subselection];
      }
    }
  }

  return [selectionTree];
}

export default function Organizer({ account }: Props) {
  const dispatch = useThunkDispatch();
  const isPhonePortrait = useIsPhonePortrait();
  const stores = useSelector(storesSelector);
  const searchQuery = useSelector(querySelector);
  useLoadStores(account);

  const history = useHistory();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const selectedItemCategoryHashes = [
    0,
    ...(params.get('category') || '').split('~').map((s) => parseInt(s, 10) || 0),
  ];
  const types = getSelectionTree(account.destinyVersion);
  const selection = drillToSelection(types, selectedItemCategoryHashes);

  // On the first render, apply the search from the query params if possible. Otherwise,
  // update the query params with the current search.
  const firstRender = useRef(true);
  useEffect(() => {
    if (!firstRender.current) {
      searchQuery ? params.set('search', searchQuery) : params.delete('search');
      history.replace({
        ...location,
        search: params.toString(),
      });
    } else if (params.has('search') && searchQuery !== params.get('search')) {
      dispatch(setSearchQuery(params.get('search')!));
    }
    firstRender.current = false;

    // We only want to do this when the search query changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const onSelection = (selection: ItemCategoryTreeNode[]) => {
    params.set(
      'category',
      selection
        .slice(1)
        .map((s) => s.itemCategoryHash)
        .join('~')
    );
    history.replace({
      ...location,
      search: params.toString(),
    });
  };

  if (isPhonePortrait) {
    return <div className={styles.noMobile}>{t('Organizer.NoMobile')}</div>;
  }

  if (!stores.length) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  return (
    <div className={styles.organizer}>
      <ErrorBoundary name="Organizer">
        <ItemTypeSelector selection={selection} selectionTree={types} onSelection={onSelection} />
        <ItemTable categories={selection} />
      </ErrorBoundary>
    </div>
  );
}
