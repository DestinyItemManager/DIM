import Switch from 'app/dim-ui/Switch';
import { t } from 'app/i18next-t';
import { toggleSearchQueryComponent } from 'app/shell/actions';
import { querySelector } from 'app/shell/selectors';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styles from './NewFeaturedGearFilter.m.scss';

/**
 * It's important since Edge of Fate to make builds that use "new gear" because
 * they have a bonus. Folks could enter this search themselves, but this filter
 * makes it easier and teaches how the search works.
 */
export default function NewFeaturedGearFilter({ className }: { className?: string }) {
  const searchQuery = useSelector(querySelector);
  const dispatch = useDispatch();
  const isEnabled = searchQuery.includes('is:featured') || searchQuery.includes('is:newgear');

  const handleToggle = useCallback(() => {
    dispatch(toggleSearchQueryComponent('is:featured'));
  }, [dispatch]);

  return (
    <div className={className}>
      <div className={styles.container}>
        <label htmlFor="newFeaturedGearSwitch">{t('LoadoutBuilder.LimitToNewFeaturedGear')}</label>
        <Switch name="newFeaturedGearSwitch" checked={isEnabled} onChange={handleToggle} />
      </div>
    </div>
  );
}
