import * as React from 'react';
import { DimItem } from '../inventory/item-types';
import { ItemPickerState } from './item-picker';
import Sheet from '../dim-ui/Sheet';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import { connect } from 'react-redux';
import { RootState } from '../store/reducers';
import { createSelector } from 'reselect';
import { storesSelector } from '../inventory/reducer';
import {
  SearchConfig,
  searchConfigSelector,
  SearchFilters,
  searchFiltersConfigSelector
} from '../search/search-filters';
import SearchFilterInput from '../search/SearchFilterInput';
import { sortItems } from '../shell/dimAngularFilters.filter';
import { itemSortOrderSelector } from '../settings/item-sort';

type ProvidedProps = ItemPickerState & {
  onSheetClosed(): void;
};

interface StoreProps {
  allItems: DimItem[];
  searchConfig: SearchConfig;
  filters: SearchFilters;
  itemSortOrder: string[];
}

function mapStateToProps(state: RootState, { filterItems }: ProvidedProps): () => StoreProps {
  const filteredItemsSelector = createSelector(
    storesSelector,
    (stores) => stores.flatMap((s) => (filterItems ? s.items.filter(filterItems) : s.items))
  );

  return () => ({
    allItems: filteredItemsSelector(state),
    searchConfig: searchConfigSelector(state),
    filters: searchFiltersConfigSelector(state),
    itemSortOrder: itemSortOrderSelector(state)
  });
}

type Props = ProvidedProps & StoreProps;

interface State {
  query: string;
}

class ItemPicker extends React.Component<Props, State> {
  state: State = { query: '' };

  render() {
    const { allItems, prompt, searchConfig, filters, itemSortOrder } = this.props;
    const { query } = this.state;

    const header = (
      <div>
        <span>{prompt || 'Choose an Item:'}</span>
        <SearchFilterInput
          searchConfig={searchConfig}
          placeholder="Search items"
          onQueryChanged={this.onQueryChanged}
        />
      </div>
    );

    const filter = filters.filterFunction(query);

    const items = sortItems(allItems.filter(filter), itemSortOrder);
    /*
    const items: DimItem[] = [];
    for (let i = 0; i < allItems.length && items.length < 10; i++) {
      if (filter(allItems[i])) {
        items.push(allItems[i]);
      }
    }*/

    // TODO: group items! (maybe by character?)
    return (
      <Sheet onClose={this.onSheetClosed} header={header}>
        {({ onClose }) => (
          <div className="sub-bucket">
            {items.map((item) => (
              <ConnectedInventoryItem
                key={item.index}
                item={item}
                onClick={() => this.onItemSelected(item, onClose)}
              />
            ))}
          </div>
        )}
      </Sheet>
    );
  }

  private onQueryChanged = (query: string) => this.setState({ query });

  private onItemSelected = (item: DimItem, onClose: () => void) => {
    this.props.onItemSelected(item);
    onClose();
  };

  private onSheetClosed = () => {
    this.props.onCancel();
    this.props.onSheetClosed();
  };
}

export default connect<StoreProps>(mapStateToProps)(ItemPicker);
