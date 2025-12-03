import Switch from 'app/dim-ui/Switch';
import { t } from 'app/i18next-t';
import { toggleSearchQueryComponent } from 'app/shell/actions';
import { featuredBannerIcon } from 'app/shell/icons';
import AppIcon from 'app/shell/icons/AppIcon';
import { querySelector } from 'app/shell/selectors';
import { useDispatch, useSelector } from 'react-redux';
import * as styles from './NewFeaturedGearFilter.m.scss';

const newFeaturedGearTerms = ['is:featured', 'is:newgear'];

/**
 * It's important since Edge of Fate to make builds that use "new gear" because
 * they have a bonus. Folks could enter this search themselves, but this filter
 * makes it easier and teaches how the search works.
 */
export default function NewFeaturedGearFilter({ className }: { className?: string }) {
  const searchQuery = useSelector(querySelector);
  const dispatch = useDispatch();
  let currentQueryTerm: string | undefined;
  for (const term of newFeaturedGearTerms) {
    if (searchQuery.includes(term)) {
      currentQueryTerm = term;
      break;
    }
  }
  const isEnabled = Boolean(currentQueryTerm);

  const handleToggle = () => {
    dispatch(toggleSearchQueryComponent(currentQueryTerm ?? newFeaturedGearTerms[0]));
  };

  return (
    <div className={className}>
      <div className={styles.container}>
        <label htmlFor="newFeaturedGearSwitch">
          <AppIcon icon={featuredBannerIcon} /> {t('LoadoutBuilder.LimitToNewFeaturedGear')}
        </label>
        <Switch name="newFeaturedGearSwitch" checked={isEnabled} onChange={handleToggle} />
      </div>
    </div>
  );
}
