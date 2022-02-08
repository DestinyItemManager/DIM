import { t } from 'app/i18next-t';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { AppIcon, faCalculator } from 'app/shell/icons';
import React from 'react';
import { Link } from 'react-router-dom';

export function OptimizerButton({ loadout }: { loadout: Loadout }) {
  return (
    <Link className="dim-button" to="../optimizer" state={{ loadout }}>
      <AppIcon icon={faCalculator} /> {t('Loadouts.OpenInOptimizer')}
    </Link>
  );
}
