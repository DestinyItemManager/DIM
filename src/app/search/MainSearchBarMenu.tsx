import ItemActionsDropdown from 'app/item-popup/item-actions/ItemActionsDropdown';
import { querySelector } from 'app/shell/selectors';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { motion } from 'framer-motion';
import React from 'react';
import { connect } from 'react-redux';
import { useLocation } from 'react-router';
import { DimItem } from '../inventory/item-types';
import { filteredItemsSelector, validateQuerySelector } from './search-filter';
import './search-filter.scss';

interface StoreProps {
  searchQuery: string;
  filteredItems: DimItem[];
  showSearchCount: boolean;
}

type Props = StoreProps & ThunkDispatchProp;

function mapStateToProps(state: RootState): StoreProps {
  const searchQuery = querySelector(state);
  return {
    searchQuery,
    showSearchCount: Boolean(searchQuery && validateQuerySelector(state)(searchQuery)),
    filteredItems: filteredItemsSelector(state),
  };
}

/**
 * The three-dots dropdown menu of actions for the search bar that act on searched items.
 */
function MainSearchBarMenu({ filteredItems, showSearchCount, searchQuery }: Props) {
  const location = useLocation();
  const onInventory = location.pathname.endsWith('inventory');

  const showSearchActions = onInventory;
  if (!showSearchActions) {
    return null;
  }

  return (
    <motion.div
      layout
      key="action"
      exit={{ scale: 0 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
    >
      <ItemActionsDropdown
        filteredItems={filteredItems}
        searchActive={showSearchCount}
        searchQuery={searchQuery}
        fixed={true}
      />
    </motion.div>
  );
}

export default connect<StoreProps>(mapStateToProps)(MainSearchBarMenu);
