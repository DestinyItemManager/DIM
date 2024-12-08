import { currentAccountSelector } from 'app/accounts/selectors';
import { t } from 'app/i18next-t';
import { ResolvedStatConstraint } from 'app/loadout-builder/types';
import { Loadout, ResolvedLoadoutItem } from 'app/loadout/loadout-types';
import { AppIcon, faCalculator } from 'app/shell/icons';
import { count } from 'app/utils/collections';
import { useSelector } from 'react-redux';
import { Link } from 'react-router';

/**
 * Link to open a loadout in the Optimizer.
 */
export function OptimizerButton({
  loadout,
  storeId,
  missingArmor,
  strictUpgradeStatConstraints,
}: {
  loadout: Loadout;
  storeId: string;
  missingArmor: boolean;
  strictUpgradeStatConstraints?: ResolvedStatConstraint[];
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
      state={{ loadout, storeId, strictUpgradeStatConstraints }}
    >
      <AppIcon icon={faCalculator} />{' '}
      {missingArmor ? t('Loadouts.PickArmor') : t('Loadouts.OpenInOptimizer')}
    </Link>
  );
}

export function armorItemsMissing(items?: ResolvedLoadoutItem[]) {
  return !items || count(items, (li) => li.loadoutItem.equip && !li.missing) < 5;
}
