import { t } from 'app/i18next-t';
import { D1Store, DimStore } from 'app/inventory/store-types';
import CollapsibleTitle from '../dim-ui/CollapsibleTitle';
import D1Reputation from './D1Reputation';

export default function D1ReputationSection({ stores }: { stores: DimStore[] }) {
  return (
    <CollapsibleTitle title={t('Bucket.Reputation')} sectionId="Reputation">
      <div className="store-row items reputation">
        {stores.map((store) => (
          <div key={store.id} className="store-cell">
            <D1Reputation store={store as D1Store} />
          </div>
        ))}
      </div>
    </CollapsibleTitle>
  );
}
