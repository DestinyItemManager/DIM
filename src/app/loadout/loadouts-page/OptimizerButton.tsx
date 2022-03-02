import { currentAccountSelector } from 'app/accounts/selectors';
import { t } from 'app/i18next-t';
import { Loadout } from 'app/loadout/loadout-types';
import { AppIcon, faCalculator } from 'app/shell/icons';
import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

/**
 * Link to open a loadout in the Optimizer.
 */
export function OptimizerButton({ loadout }: { loadout: Loadout }) {
  // We need to build an absolute path rather than a relative one because the loadout editor is mounted higher than the destiny routes.
  const account = useSelector(currentAccountSelector);
  if (!account) {
    return null;
  }
  return (
    <Link
      className="dim-button"
      to={`/${account.membershipId}/d${account.destinyVersion}/optimizer`}
      state={{ loadout }}
    >
      <AppIcon icon={faCalculator} /> {t('Loadouts.OpenInOptimizer')}
    </Link>
  );
}
