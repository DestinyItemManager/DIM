import { settingSelector } from 'app/dim-api/selectors';
import { scrollToPosition } from 'app/dim-ui/scroll';
import { useD2Definitions } from 'app/manifest/selectors';
import { percent } from 'app/shell/formatters';
import { DestinyPresentationScreenStyle } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { deepEqual } from 'fast-equals';
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import BungieImage from '../dim-ui/BungieImage';
import { AppIcon, collapseIcon, expandIcon } from '../shell/icons';
import styles from './PresentationNode.m.scss';
import './PresentationNode.scss';
import PresentationNodeLeaf from './PresentationNodeLeaf';
import { DimPresentationNode } from './presentation-nodes';

export default function PresentationNode({
  node,
  ownedItemHashes,
  path,
  parents,
  onNodePathSelected,
  isInTriumphs,
  isRootNode,
  overrideName,
}: {
  node: DimPresentationNode;
  ownedItemHashes?: Set<number>;
  path: number[];
  parents: number[];
  isInTriumphs?: boolean;
  overrideName?: string;
  isRootNode?: boolean;
  onNodePathSelected: (nodePath: number[]) => void;
}) {
  const defs = useD2Definitions()!;
  const completedRecordsHidden = useSelector(settingSelector('completedRecordsHidden'));
  const redactedRecordsRevealed = useSelector(settingSelector('redactedRecordsRevealed'));
  const sortRecordProgression = useSelector(settingSelector('sortRecordProgression'));
  const presentationNodeHash = node.hash;
  const headerRef = useScrollNodeIntoView(path, presentationNodeHash);

  const expandChildren = () => {
    const childrenExpanded = path.includes(presentationNodeHash);
    onNodePathSelected(childrenExpanded ? parents : [...parents, presentationNodeHash]);
    return false;
  };

  const { visible, acquired } = node;
  const completed = Boolean(acquired >= visible);

  if (!visible) {
    return null;
  }

  const parent = parents.slice(-1)[0];
  const thisAndParents = [...parents, presentationNodeHash];

  // "CategorySet" DestinyPresentationScreenStyle is for armor sets
  const aParentIsCategorySetStyle = thisAndParents.some(
    (p) =>
      p > 0 &&
      defs.PresentationNode.get(p)?.screenStyle === DestinyPresentationScreenStyle.CategorySets
  );

  const alwaysExpanded =
    // if we're not in triumphs
    !isInTriumphs &&
    // & we're 4 levels deep(collections:weapon), or in CategorySet & 5 deep (collections:armor)
    thisAndParents.length >= (aParentIsCategorySetStyle ? 5 : 4);

  const onlyChild =
    // if this is a child of a child
    parents.length > 0 &&
    // and has no siblings
    defs.PresentationNode.get(parent).children.presentationNodes.length === 1;

  /** whether this node's children are currently shown */
  const childrenExpanded =
    isRootNode || onlyChild || path.includes(presentationNodeHash) || alwaysExpanded;

  const title = <PresentationNodeTitle displayProperties={node} overrideName={overrideName} />;

  return (
    <div
      className={clsx('presentation-node', {
        [styles.onlyChild]: onlyChild,
        'always-expanded': alwaysExpanded,
      })}
    >
      {!onlyChild && !isRootNode && (
        <div
          className={clsx('title', {
            collapsed: !childrenExpanded,
            'hide-complete': completedRecordsHidden,
            completed,
          })}
          onClick={expandChildren}
          ref={headerRef}
        >
          {alwaysExpanded ? (
            title
          ) : (
            <span className="collapse-handle">
              <AppIcon
                className="collapse-icon"
                icon={childrenExpanded ? collapseIcon : expandIcon}
              />{' '}
              {title}
            </span>
          )}
          <PresentationNodeProgress acquired={acquired} visible={visible} />
        </div>
      )}
      {childrenExpanded &&
        node.childPresentationNodes?.map((subNode) => (
          <PresentationNode
            key={subNode.hash}
            node={subNode}
            ownedItemHashes={ownedItemHashes}
            path={path}
            parents={thisAndParents}
            onNodePathSelected={onNodePathSelected}
            isInTriumphs={isInTriumphs}
          />
        ))}
      {childrenExpanded && visible > 0 && (
        <PresentationNodeLeaf
          node={node}
          ownedItemHashes={ownedItemHashes}
          completedRecordsHidden={completedRecordsHidden}
          redactedRecordsRevealed={redactedRecordsRevealed}
          sortRecordProgression={sortRecordProgression}
        />
      )}
    </div>
  );
}

/**
 * Scrolls the given presentation node into view if it is not already. Assign
 * the returned headerRef to the header of the presentation node.
 */
function useScrollNodeIntoView(path: number[], presentationNodeHash: number) {
  const headerRef = useRef<HTMLDivElement>(null);
  const lastPath = useRef<number[]>();

  useEffect(() => {
    if (
      headerRef.current &&
      path[path.length - 1] === presentationNodeHash &&
      !deepEqual(lastPath.current, path)
    ) {
      const clientRect = headerRef.current.getBoundingClientRect();
      if (clientRect.top < 50) {
        scrollToPosition({
          top: window.scrollY + clientRect.top - 50,
          left: 0,
          behavior: 'smooth',
        });
      }
    }
    lastPath.current = path;
  }, [path, presentationNodeHash]);

  return headerRef;
}

/**
 * The little progress bar in the header of a presentation node that shows how much has been unlocked.
 */
export function PresentationNodeProgress({
  acquired,
  visible,
}: {
  acquired: number;
  visible: number;
}) {
  return (
    <div className={styles.nodeProgress}>
      <div className={styles.nodeProgressCount}>
        {acquired} / {visible}
      </div>
      <div className={styles.nodeProgressBar}>
        <div
          className={styles.nodeProgressBarAmount}
          style={{ width: percent(acquired / visible) }}
        />
      </div>
    </div>
  );
}

export function PresentationNodeTitle({
  displayProperties,
  overrideName,
}: {
  displayProperties: { name: string; icon: string };
  overrideName?: string;
}) {
  return (
    <span className={styles.nodeName}>
      {displayProperties.icon && <BungieImage src={displayProperties.icon} />}{' '}
      {overrideName || displayProperties.name}
    </span>
  );
}
