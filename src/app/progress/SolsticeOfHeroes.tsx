import React from 'react';
import Pursuit from './Pursuit';
import _ from 'lodash';
import { DimStore } from 'app/inventory/store-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions.service';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import { D2EventEnum } from 'data/d2/d2-event-info';

/**
 * List out all the Pursuits for the character, grouped out in a useful way.
 */
export default function SolsticeOfHeroes({
  store,
  defs,
  title
}: {
  title: string;
  store: DimStore;
  defs?: D2ManifestDefinitions;
}) {
  if (!defs) {
    return null;
  }

  const filteredItems = store.items.filter(
    (item) =>
      item.bucket.inArmor &&
      item.isDestiny2() &&
      item.event === D2EventEnum.SOLSTICE_OF_HEROES &&
      item.objectives &&
      item.objectives.length > 0 &&
      item.canBeEquippedBy(store)
  );

  if (!filteredItems.length) {
    return null;
  }

  return (
    <section id="solstice">
      <CollapsibleTitle title={title} sectionId="solstice">
        <div className="progress-row">
          <ErrorBoundary name="Solstice">
            <div className="progress-for-character">
              {filteredItems.map((item) => (
                <Pursuit item={item} key={item.index} />
              ))}
            </div>
          </ErrorBoundary>
        </div>
      </CollapsibleTitle>
    </section>
  );
}
