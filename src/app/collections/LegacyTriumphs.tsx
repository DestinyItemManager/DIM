import { t } from 'app/i18next-t';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import React, { useState } from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import {
  filterPresentationNodesToSearch,
  filterToLegacyTriumphs,
  toPresentationNodeTree,
} from './presentation-nodes';
import PresentationNode from './PresentationNode';
import PresentationNodeSearchResults from './PresentationNodeSearchResults';

interface Props {
  presentationNodeHash: number;
  profileResponse: DestinyProfileResponse;
  defs: D2ManifestDefinitions;
  searchQuery?: string;
  completedRecordsHidden: boolean;
}

/**
 * The root for an expandable presentation node tree.
 */
export default function LegacyTriumphs({
  presentationNodeHash,
  defs,
  profileResponse,
  searchQuery,
  completedRecordsHidden,
}: Props) {
  const [nodePath, setNodePath] = useState<number[]>([]);

  const nodeTree = filterToLegacyTriumphs(
    toPresentationNodeTree(defs, undefined, profileResponse, presentationNodeHash)
  );
  if (!nodeTree) {
    return null;
  }

  if (searchQuery) {
    const searchResults = filterPresentationNodesToSearch(
      nodeTree,
      searchQuery.toLowerCase(),
      _.stubTrue,
      completedRecordsHidden
    );

    return (
      <PresentationNodeSearchResults
        searchResults={searchResults}
        defs={defs}
        profileResponse={profileResponse}
      />
    );
  }

  return (
    <div className="presentation-node-root">
      <PresentationNode
        node={nodeTree}
        defs={defs}
        path={nodePath}
        onNodePathSelected={setNodePath}
        parents={[]}
        overrideName={t('Progress.LegacyTriumphs')}
        isInTriumphs={true}
        isRootNode={true}
      />
    </div>
  );
}
