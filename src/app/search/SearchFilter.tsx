import React, { useMemo, useCallback } from 'react';
import { t } from 'app/i18next-t';
import { connect, MapDispatchToPropsFunction } from 'react-redux';
import { RootState } from 'app/store/types';
import { setSearchQuery } from '../shell/actions';
import _ from 'lodash';
import './search-filter.scss';
import { SearchFilterRef } from './SearchBar';
import { searchQueryVersionSelector, querySelector } from 'app/shell/reducer';
import SearchBar from './SearchBar';
import MainSearchBarActions from './MainSearchBarActions';

interface ProvidedProps {
  onClear?(): void;
}

interface StoreProps {
  isPhonePortrait: boolean;
  searchQueryVersion: number;
  searchQuery: string;
}

type DispatchProps = {
  setSearchQuery(query: string): void;
};
const mapDispatchToProps: MapDispatchToPropsFunction<DispatchProps, StoreProps> = (dispatch) => ({
  setSearchQuery: (query) => dispatch(setSearchQuery(query, true)),
});

type Props = ProvidedProps & StoreProps & DispatchProps;

function mapStateToProps(state: RootState): StoreProps {
  return {
    isPhonePortrait: state.shell.isPhonePortrait,
    searchQuery: querySelector(state),
    searchQueryVersion: searchQueryVersionSelector(state),
  };
}

export function SearchFilter(
  { isPhonePortrait, setSearchQuery, searchQuery, searchQueryVersion, onClear }: Props,
  ref: React.Ref<SearchFilterRef>
) {
  const onClearFilter = useCallback(() => {
    onClear?.();
  }, [onClear]);

  const placeholder = useMemo(
    () =>
      isPhonePortrait
        ? t('Header.FilterHelpBrief')
        : t('Header.FilterHelp', { example: 'is:dupe, is:maxpower, -is:blue' }),
    [isPhonePortrait]
  );

  const extras = useMemo(() => <MainSearchBarActions />, []);

  return (
    <SearchBar
      ref={ref}
      onQueryChanged={setSearchQuery}
      placeholder={placeholder}
      onClear={onClearFilter}
      searchQueryVersion={searchQueryVersion}
      searchQuery={searchQuery}
      mainSearchBar={true}
    >
      {extras}
    </SearchBar>
  );
}

export default connect<StoreProps, DispatchProps>(mapStateToProps, mapDispatchToProps, null, {
  forwardRef: true,
})(React.forwardRef(SearchFilter));
