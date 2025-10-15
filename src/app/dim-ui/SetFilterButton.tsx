import { setSearchQuery } from 'app/shell/actions';
import { AppIcon, searchIcon } from 'app/shell/icons';
import { useDispatch } from 'react-redux';
import * as styles from './SetFilterButton.m.scss';

/** a simple low-profile button that changes the header search field to the provided string */
export function SetFilterButton({ filter }: { filter: string }) {
  const dispatch = useDispatch();
  return (
    <a
      onClick={() => {
        dispatch(setSearchQuery(filter));
      }}
      title={filter}
      className={styles.setFilterButton}
    >
      <AppIcon icon={searchIcon} />
    </a>
  );
}
