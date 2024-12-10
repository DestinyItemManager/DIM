import useBulkNote from 'app/dim-ui/useBulkNote';
import ItemActionsDropdown from 'app/item-actions/ItemActionsDropdown';
import { querySelector } from 'app/shell/selectors';
import { motion } from 'motion/react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { searchButtonAnimateVariants } from './SearchBar';
import { filteredItemsSelector, queryValidSelector } from './items/item-search-filter';

/**
 * The three-dots dropdown menu of actions for the search bar that act on searched items.
 */
export default function MainSearchBarMenu() {
  const location = useLocation();
  const searchQuery = useSelector(querySelector);
  const queryValid = useSelector(queryValidSelector);
  const showSearchCount = Boolean(searchQuery && queryValid);
  const filteredItems = useSelector(filteredItemsSelector);
  const onInventory = location.pathname.endsWith('inventory');

  const [promptDialog, bulkNote] = useBulkNote();

  const showSearchActions = onInventory;
  if (!showSearchActions) {
    return null;
  }

  return (
    <motion.div
      layout
      key="action"
      variants={searchButtonAnimateVariants}
      exit="hidden"
      initial="hidden"
      animate="shown"
    >
      {promptDialog}
      <ItemActionsDropdown
        filteredItems={filteredItems}
        searchActive={showSearchCount}
        searchQuery={searchQuery}
        fixed={true}
        bulkNote={bulkNote}
      />
    </motion.div>
  );
}
