import usePrompt from 'app/dim-ui/usePrompt';
import ItemActionsDropdown from 'app/item-actions/ItemActionsDropdown';
import { querySelector } from 'app/shell/selectors';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { filteredItemsSelector, queryValidSelector } from './search-filter';

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

  const [promptDialog, prompt] = usePrompt();

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
      {promptDialog}
      <ItemActionsDropdown
        filteredItems={filteredItems}
        searchActive={showSearchCount}
        searchQuery={searchQuery}
        fixed={true}
        prompt={prompt}
      />
    </motion.div>
  );
}
