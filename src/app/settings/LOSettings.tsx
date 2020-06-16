import React from 'react';
import { t } from 'app/i18next-t';
import SortOrderEditor, { SortProperty } from './SortOrderEditor';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from 'app/store/reducers';
import { setSetting } from './actions';
import Checkbox from './Checkbox';

interface Props {
  onChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
}

function LOSettings({ onChange }: Props) {
  const statDefs = useSelector(
    (state: RootState) => state.manifest.d2Manifest?.Stat.getAll() || []
  );
  const { loStatSortOrder, loAssumeMasterwork } = useSelector(
    (state: RootState) => state.dimApi.settings
  );
  const dispatch = useDispatch();

  const statOrder: SortProperty[] = [];

  for (const def of loStatSortOrder.map((stat) => statDefs[stat])) {
    if (def) {
      statOrder.push({
        id: def?.hash.toString(),
        displayName: def?.displayProperties.name,
        enabled: true,
      });
    }
  }

  const statSortOrderChanged = (sortOrder: SortProperty[]) => {
    dispatch(
      setSetting(
        'loStatSortOrder',
        sortOrder.filter((o) => o.enabled).map((o) => parseInt(o.id, 10))
      )
    );
  };

  return (
    <section id="lo">
      <h2>{t('Settings.LoadoutOptimizer')}</h2>
      <div className="setting">
        <label htmlFor="itemSort">{t('Settings.SetLOStatSort')}</label>

        <SortOrderEditor order={statOrder} onSortOrderChanged={statSortOrderChanged} />
      </div>
      <Checkbox
        label={t('Settings.AssumeMasterwork')}
        name="loAssumeMasterwork"
        value={loAssumeMasterwork}
        onChange={onChange}
      />
    </section>
  );
}

export default LOSettings;
