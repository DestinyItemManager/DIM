import { DimStore } from 'app/inventory/store-types';
import { InGameLoadout } from 'app/loadout-drawer/loadout-types';
import { memo } from 'react';
import InGameLoadoutView from './InGameLoadoutView';

/**
 * A single row in the Loadouts page for an in game D2 loadout (post-Lightfall).
 */
export default memo(function InGameLoadoutRow({
  loadout,
  store,
}: {
  loadout: InGameLoadout;
  store: DimStore;
}) {
  return <InGameLoadoutView loadout={loadout} store={store} actionButtons={[]} />;
});
