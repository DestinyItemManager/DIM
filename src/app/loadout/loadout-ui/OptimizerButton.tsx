import { currentAccountSelector } from 'app/accounts/selectors';
import { t } from 'app/i18next-t';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { AppIcon, faCalculator } from 'app/shell/icons';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

/**
 * Link to open a loadout in the Optimizer.
 */
export function OptimizerButton({
  loadout,
  storeId,
  missingArmor,
}: {
  loadout: Loadout;
  storeId: string;
  missingArmor: boolean;
}) {
  // We need to build an absolute path rather than a relative one because the loadout editor is mounted higher than the destiny routes.
  const account = useSelector(currentAccountSelector);
  if (!account) {
    return null;
  }
  return (
    <Link
      className="dim-button"
      to={`/${account.membershipId}/d${account.destinyVersion}/optimizer`}
      state={{ loadout, storeId }}
    >
      <AppIcon icon={faCalculator} />{' '}
      {missingArmor ? t('Loadouts.ChooseArmor') : t('Loadouts.OpenInOptimizer')}
    </Link>
  );
}
