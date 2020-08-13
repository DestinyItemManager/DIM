import React from 'react';
import { DimGridNode, D1GridNode, DimItem } from '../inventory/item-types';
import _ from 'lodash';
import clsx from 'clsx';
import PressTip from '../dim-ui/PressTip';
import { bungieNetPath } from '../dim-ui/BungieImage';
import './ItemTalentGrid.scss';
import { ratePerks } from '../destinyTrackerApi/perkRater';
import { connect } from 'react-redux';
import { RootState } from 'app/store/types';
import { getReviews } from '../item-review/reducer';
import { D1ItemUserReview } from '../item-review/d1-dtr-api-types';
import { emptySet, emptyArray } from 'app/utils/empty';

interface ProvidedProps {
  item: DimItem;
  perksOnly?: boolean;
}

interface StoreProps {
  bestPerks: Set<number>;
}

function mapStateToProps(state: RootState, { item }: ProvidedProps): StoreProps {
  // TODO: selector!
  const reviewResponse = $featureFlags.reviewsEnabled ? getReviews(item, state) : undefined;
  const reviews = reviewResponse ? reviewResponse.reviews : emptyArray();
  const bestPerks =
    $featureFlags.reviewsEnabled && item.isDestiny1()
      ? ratePerks(item, reviews as D1ItemUserReview[])
      : emptySet<number>();
  return {
    bestPerks,
  };
}

type Props = ProvidedProps & StoreProps;

// TODO: There's enough here to make a decent D2 talent grid for subclasses: https://imgur.com/a/3wNRq
function ItemTalentGrid({ item, perksOnly, bestPerks }: Props) {
  // TODO: useEffect to dispatch review load

  const talentGrid = item.talentGrid;

  if (!talentGrid) {
    return null;
  }
  const infuseHash = 1270552711;
  const nodeSize = 34;
  const nodePadding = 4;
  const scaleFactor = 1.1;
  const totalNodeSize = nodeSize + nodePadding;

  let hiddenColumns = 0;
  if (perksOnly) {
    if (talentGrid.nodes.find((n) => n.hash === infuseHash)) {
      hiddenColumns += 1;
    }
    if (talentGrid.nodes.find((n) => n.hash === 2133116599)) {
      hiddenColumns += 1;
    }
  }

  const visibleNodes = talentGrid.nodes.filter((n) => !n.hidden);
  const numColumns = _.maxBy(visibleNodes, (n) => n.column)!.column + 1 - hiddenColumns;
  const numRows = perksOnly ? 2 : _.maxBy(visibleNodes, (n) => n.row)!.row + 1;

  return (
    <svg
      preserveAspectRatio="xMaxYMin meet"
      viewBox={`0 0 ${(numColumns * totalNodeSize - nodePadding) * scaleFactor} ${
        (numRows * totalNodeSize - nodePadding) * scaleFactor + 1
      }`}
      className="talent-grid"
      height={(numRows * totalNodeSize - nodePadding) * scaleFactor}
      width={(numColumns * totalNodeSize - nodePadding) * scaleFactor}
    >
      <g transform={`scale(${scaleFactor})`}>
        {talentGridNodesFilter(talentGrid.nodes, hiddenColumns).map((node) => (
          <PressTip
            elementType="g"
            key={node.hash}
            tooltip={
              <>
                <h2>{node.name}</h2>
                <div>{node.description}</div>
              </>
            }
          >
            <g
              transform={`translate(${(node.column - hiddenColumns) * totalNodeSize},${
                node.row * totalNodeSize
              })`}
              className={clsx('talent-node', {
                'talent-node-activated': node.activated,
                'talent-node-showxp': isD1GridNode(node) && !node.activated && node.xpRequired,
                'talent-node-default':
                  node.activated &&
                  (!isD1GridNode(node) || !node.xpRequired) &&
                  !node.exclusiveInColumn &&
                  node.column < 1,
              })}
            >
              {isD1GridNode(node) && bestPerks.has(node.hash) && !node.activated && (
                <circle className="talent-node-best-rated-circle" r="5" cx="30" cy="5" />
              )}
              <circle
                r="16"
                cx="-17"
                cy="17"
                transform="rotate(-90)"
                className="talent-node-xp"
                strokeWidth={isD1GridNode(node) && node.xp ? 2 : 0}
                strokeDasharray={
                  isD1GridNode(node) ? `${(100 * node.xp) / node.xpRequired} 100` : undefined
                }
              />
              <image
                className="talent-node-img"
                href={bungieNetPath(node.icon)}
                x="20"
                y="20"
                height="96"
                width="96"
                transform="scale(0.25)"
              />
              <title>
                {node.name}&#10;{node.description}
              </title>
            </g>
          </PressTip>
        ))}
      </g>
    </svg>
  );
}

function talentGridNodesFilter(nodes: DimGridNode[], hiddenColumns: number) {
  return (nodes || []).filter((node) => !node.hidden && node.column >= hiddenColumns);
}

function isD1GridNode(node: DimGridNode): node is D1GridNode {
  const d1Node = node as D1GridNode;
  return Boolean(d1Node.xp || d1Node.xpRequired || d1Node.xpRequirementMet);
}

export default connect<StoreProps>(mapStateToProps)(ItemTalentGrid);
