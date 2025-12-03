import { percent } from 'app/shell/formatters';
import { maxOf } from 'app/utils/collections';
import clsx from 'clsx';
import { memo } from 'react';
import { bungieNetPath } from '../dim-ui/BungieImage';
import { PressTip, Tooltip } from '../dim-ui/PressTip';
import { D1GridNode, D1Item } from '../inventory/item-types';
import * as styles from './ItemTalentGrid.m.scss';

/**
 * The talent grid was the grid of perks for D1 items. It is not used for any D2 item.
 */
export default memo(function ItemTalentGrid({
  item,
  perksOnly,
  className,
}: {
  item: D1Item;
  className?: string;
  perksOnly?: boolean;
}) {
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
  const numColumns = maxOf(visibleNodes, (n) => n.column) + 1 - hiddenColumns;
  const numRows = maxOf(visibleNodes, (n) => n.row) + 1;

  const height = (numRows * totalNodeSize - nodePadding) * scaleFactor;
  const width = (numColumns * totalNodeSize - nodePadding) * scaleFactor;

  return (
    <svg
      preserveAspectRatio="xMaxYMin meet"
      viewBox={`0 0 ${width} ${height}`}
      className={clsx(styles.talentGrid, className)}
      height={height}
      width={width}
    >
      <g transform={`scale(${scaleFactor})`}>
        {talentGridNodesFilter(talentGrid.nodes, hiddenColumns).map((node) => (
          <PressTip
            elementType="g"
            key={node.hash}
            tooltip={
              <>
                <Tooltip.Header text={node.name} />
                <div>{node.description}</div>
              </>
            }
          >
            <g
              transform={`translate(${(node.column - hiddenColumns) * totalNodeSize},${
                node.row * totalNodeSize
              })`}
              className={clsx({
                [styles.activated]: node.activated,
                [styles.showXp]: !node.activated && node.xpRequired,
                [styles.defaultOption]:
                  node.activated && !node.xpRequired && !node.exclusiveInColumn && node.column < 1,
              })}
            >
              <circle
                r="16"
                cx="-17"
                cy="17"
                transform="rotate(-90)"
                className={styles.nodeXp}
                strokeWidth={node.xp ? 2 : 0}
                strokeDasharray={`${percent(node.xp / node.xpRequired)} 100`}
              />
              <image
                className={styles.nodeImg}
                href={bungieNetPath(node.icon)}
                x="20"
                y="20"
                height="96"
                width="96"
                transform="scale(0.25)"
              />
            </g>
          </PressTip>
        ))}
      </g>
    </svg>
  );
});

function talentGridNodesFilter(nodes: D1GridNode[], hiddenColumns: number) {
  return (nodes || []).filter((node) => !node.hidden && node.column >= hiddenColumns);
}
