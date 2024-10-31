import { DestinyAccount } from 'app/accounts/destiny-account';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { useLoadStores } from 'app/inventory/store/hooks';
import { setSearchQuery } from 'app/shell/actions';
import { querySelector, useIsPhonePortrait } from 'app/shell/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { usePageTitle } from 'app/utils/hooks';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router';
import ItemTable from './ItemTable';
import ItemTypeSelector, { ItemCategoryTreeNode, getSelectionTree } from './ItemTypeSelector';
import styles from './Organizer.m.scss';

interface Props {
  account: DestinyAccount;
}

/**
 * Given a tree of item categories, and a flat list of item category hashes that
 * describe a path through that tree, return the nodes from the tree along that
 * path.
 */
function drillToSelection(
  selectionTree: ItemCategoryTreeNode | undefined,
  selectedItemCategoryHashes: ItemCategoryHashes[],
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
  usePageTitle(t('Organizer.Organizer'));
  const dispatch = useThunkDispatch();
  const isPhonePortrait = useIsPhonePortrait();
  const searchQuery = useSelector(querySelector);
  const storesLoaded = useLoadStores(account);

  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  // Get selected categories from URL
  const selectedItemCategoryHashes = [
    0,
    ...(params.get('category') || '').split('~').map((s) => parseInt(s, 10) || 0),
  ];
  const types = getSelectionTree(account.destinyVersion);
  const selection = drillToSelection(types, selectedItemCategoryHashes);

  // TODO: useSearchParams?
  // On the first render, apply the search from the query params if possible. Otherwise,
  // update the query params with the current search.
  const firstRender = useRef(true);
  useEffect(() => {
    if (!firstRender.current) {
      searchQuery ? params.set('search', searchQuery) : params.delete('search');
      navigate(
        {
          ...location,
          search: params.toString(),
        },
        { replace: true },
      );
    } else if (params.has('search') && searchQuery !== params.get('search')) {
      dispatch(setSearchQuery(params.get('search')!));
    }
    firstRender.current = false;

    // We only want to do this when the search query changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // When new item categories are selected, set the URL to the new selection, and
  // allow the URL to set the state. The URL is our state store, and this means
  // it's easy to link to a selection or preserve state across reloads.
  const onSelection = (selection: ItemCategoryTreeNode[]) => {
    params.set(
      'category',
      selection
        .slice(1)
        .map((s) => s.itemCategoryHash)
        .join('~'),
    );
    navigate(
      {
        ...location,
        search: params.toString(),
      },
      { replace: true },
    );
  };

  if (isPhonePortrait) {
    return <div className={styles.noMobile}>{t('Organizer.NoMobile')}</div>;
  }

  if (!storesLoaded) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  return (
    <div className={styles.organizer}>
      <ItemTypeSelector selection={selection} selectionTree={types} onSelection={onSelection} />
      <ItemTable categories={selection} />
    </div>
  );
}
