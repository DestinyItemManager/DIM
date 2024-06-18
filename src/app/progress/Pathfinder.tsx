import { trackedTriumphsSelector } from 'app/dim-api/selectors';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { DimItem } from 'app/inventory/item-types';
import { createItemContextSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { toPresentationNodeTree } from 'app/records/presentation-nodes';
import { addDividers } from 'app/utils/react';
import { DestinyPresentationNodeDefinition, DestinyRecordState } from 'bungie-api-ts/destiny2';
import { useSelector } from 'react-redux';
import styles from './Pathfinder.m.scss';
import Pursuit from './Pursuit';
import { recordToPursuitItem } from './milestone-items';

/**
 * List out all the seasonal challenges for the character, grouped out in a useful way.
 */
export default function Pathfinder({
  id,
  name,
  presentationNode,
  store,
}: {
  id: string;
  name: string;
  presentationNode: DestinyPresentationNodeDefinition;
  store: DimStore;
}) {
  const itemCreationContext = useSelector(createItemContextSelector);
  const nodeTree = toPresentationNodeTree(itemCreationContext, presentationNode.hash);

  const allRecords = nodeTree?.childPresentationNodes?.[0]?.records?.toReversed() ?? [];
  console.log(name, { nodeTree, allRecords });

  const trackedRecords = useSelector(trackedTriumphsSelector);

  const acquiredRecords = new Set<number>();

  const pursuits = allRecords
    .filter((r) => {
      // Don't show records that have been redeemed
      const state = r.recordComponent.state;
      const acquired = Boolean(state & DestinyRecordState.RecordRedeemed);
      if (acquired) {
        acquiredRecords.add(r.recordDef.hash);
      }
      return true /* !acquired */ /* && !(state & DestinyRecordState.RewardUnavailable) */;
    })
    .map((r) =>
      recordToPursuitItem(
        r,
        itemCreationContext.buckets,
        store,
        presentationNode.displayProperties.name,
        trackedRecords.includes(r.recordDef.hash),
      ),
    );

  const pursuitGroups: DimItem[][] = [];
  for (let i = 6; i > 0; i--) {
    pursuitGroups.push(pursuits.splice(0, i));
  }

  return (
    <section id={id} className="pathfinder">
      <CollapsibleTitle title={name} sectionId={id}>
        {addDividers(
          pursuitGroups.map((pursuits) => (
            <div key={pursuits.length} className={styles.pathfinderRow}>
              {pursuits.map((item) => (
                <Pursuit
                  item={item}
                  key={item.index}
                  className={
                    acquiredRecords.has(item.pursuit?.recordHash ?? 0)
                      ? styles.completed
                      : undefined
                  }
                />
              ))}
            </div>
          )),
          <hr className={styles.divider} />,
        )}
      </CollapsibleTitle>
    </section>
  );
}
