import { storesSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import HeaderWarningBanner from 'app/shell/HeaderWarningBanner';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';

const d1BrokenSelector = createSelector(
  storesSelector,
  (stores: DimStore[]) =>
    stores[0]?.destinyVersion === 1 && !stores.some((s) => s.items.some((i) => !i.equipped)),
);

export default function D1BrokenWarning() {
  const d1Broken = useSelector(d1BrokenSelector);
  if (d1Broken) {
    return (
      <HeaderWarningBanner>
        Bungie accidentally broke the D1 API, so DIM cannot show unequipped items or move items.
        They are aware but there is no ETA for a fix.
      </HeaderWarningBanner>
    );
  }
  return null;
}
