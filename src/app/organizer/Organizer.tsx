/* eslint-disable react/jsx-key, react/prop-types */
import { DestinyAccount } from 'app/accounts/destiny-account';
import { destinyVersionSelector } from 'app/accounts/selectors';
import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { storesSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { useLoadStores } from 'app/inventory/store/hooks';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { setSearchQuery } from 'app/shell/actions';
import { querySelector } from 'app/shell/selectors';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import React, { useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { useHistory, useLocation } from 'react-router';
import ItemTable from './ItemTable';
import ItemTypeSelector, { getSelectionTree, ItemCategoryTreeNode } from './ItemTypeSelector';
import styles from './Organizer.m.scss';

interface ProvidedProps {
  account: DestinyAccount;
}

interface StoreProps {
  stores: DimStore[];
  defs: D2ManifestDefinitions | D1ManifestDefinitions;
  isPhonePortrait: boolean;
  searchQuery: string;
}

function mapStateToProps() {
  return (state: RootState): StoreProps => ({
    defs:
      destinyVersionSelector(state) === 2 ? d2ManifestSelector(state)! : state.manifest.d1Manifest!,
    stores: storesSelector(state),
    isPhonePortrait: state.shell.isPhonePortrait,
    searchQuery: querySelector(state),
  });
}

type Props = ProvidedProps & StoreProps & ThunkDispatchProp;

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

function Organizer({ account, defs, stores, isPhonePortrait, searchQuery, dispatch }: Props) {
  useLoadStores(account, stores.length > 0);

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
        <ItemTypeSelector
          defs={defs}
          selection={selection}
          selectionTree={types}
          onSelection={onSelection}
        />
        <ItemTable categories={selection} />
      </ErrorBoundary>
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(Organizer);
