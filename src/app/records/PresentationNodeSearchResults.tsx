import { settingSelector } from 'app/dim-api/selectors';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import { useSelector } from 'react-redux';
import PresentationNodeLeaf from './PresentationNodeLeaf';
import PresentationNodeRoot from './PresentationNodeRoot';
import * as styles from './PresentationNodeSearchResults.m.scss';
import { DimPresentationNodeSearchResult } from './presentation-nodes';

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
  const redactedRecordsRevealed = useSelector(settingSelector('redactedRecordsRevealed'));
  const sortRecordProgression = useSelector(settingSelector('sortRecordProgression'));
  return (
    <div>
      {searchResults.map((sr) => (
        <div key={sr.path.map((p) => p.hash).join('.')}>
          <ul className={styles.path}>
            {sr.path.map((p, index) => index > 0 && <li key={p.hash}>{p.name}</li>)}
          </ul>
          <div>
            {!sr.collectibles &&
              !sr.records &&
              !sr.metrics &&
              !sr.craftables &&
              !sr.plugs &&
              (() => {
                const node = sr.path.at(-1)!;
                return node.childPresentationNodes ? (
                  <PresentationNodeRoot
                    presentationNodeHash={node.hash}
                    ownedItemHashes={ownedItemHashes}
                    profileResponse={profileResponse}
                  />
                ) : (
                  <PresentationNodeLeaf
                    node={node}
                    ownedItemHashes={ownedItemHashes}
                    redactedRecordsRevealed={redactedRecordsRevealed}
                    sortRecordProgression={sortRecordProgression}
                  />
                );
              })()}
            <PresentationNodeLeaf
              node={sr}
              ownedItemHashes={ownedItemHashes}
              redactedRecordsRevealed={redactedRecordsRevealed}
              sortRecordProgression={sortRecordProgression}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
