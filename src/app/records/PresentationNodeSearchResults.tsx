import { settingSelector } from 'app/dim-api/selectors';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import React from 'react';
import { useSelector } from 'react-redux';
import { DimPresentationNodeSearchResult } from './presentation-nodes';
import PresentationNodeLeaf from './PresentationNodeLeaf';
import PresentationNodeRoot from './PresentationNodeRoot';
import styles from './PresentationNodeSearchResults.m.scss';

export default function PresentationNodeSearchResults({
  searchResults,
  ownedItemHashes,
  profileResponse,
}: {
  searchResults: DimPresentationNodeSearchResult[];
  ownedItemHashes?: Set<number>;
  profileResponse: DestinyProfileResponse;
}) {
  // TODO: make each node in path linkable
  const completedRecordsHidden = useSelector(settingSelector('completedRecordsHidden'));
  const redactedRecordsRevealed = useSelector(settingSelector('redactedRecordsRevealed'));

  return (
    <div>
      {searchResults.map((sr) => (
        <div key={sr.path.map((p) => p.nodeDef.hash).join('.')}>
          <ul className={styles.path}>
            {sr.path.map(
              (p, index) =>
                index > 0 && <li key={p.nodeDef.hash}>{p.nodeDef.displayProperties.name}</li>
            )}
          </ul>
          <div>
            {!sr.collectibles &&
              !sr.records &&
              !sr.metrics &&
              !sr.craftables &&
              (() => {
                const node = sr.path[sr.path.length - 1];
                return node.childPresentationNodes ? (
                  <PresentationNodeRoot
                    presentationNodeHash={node.nodeDef.hash}
                    ownedItemHashes={ownedItemHashes}
                    profileResponse={profileResponse}
                  />
                ) : (
                  <PresentationNodeLeaf
                    node={node}
                    ownedItemHashes={ownedItemHashes}
                    completedRecordsHidden={completedRecordsHidden}
                    redactedRecordsRevealed={redactedRecordsRevealed}
                  />
                );
              })()}
            <PresentationNodeLeaf
              node={sr}
              ownedItemHashes={ownedItemHashes}
              completedRecordsHidden={completedRecordsHidden}
              redactedRecordsRevealed={redactedRecordsRevealed}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
