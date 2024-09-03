import { settingSelector } from 'app/dim-api/selectors';
import { CollapsedSection, Title } from 'app/dim-ui/CollapsibleTitle';
import { scrollToPosition } from 'app/dim-ui/scroll';
import { DimTitle } from 'app/inventory/store-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { percent } from 'app/shell/formatters';
import { DestinyPresentationScreenStyle } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { FontGlyphs } from 'data/font/d2-font-glyphs';
import { deepEqual } from 'fast-equals';
import { useEffect, useId, useRef } from 'react';
import { useSelector } from 'react-redux';
import BungieImage from '../dim-ui/BungieImage';
import styles from './PresentationNode.m.scss';
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

  const id = useId();
  const contentId = `content-${id}`;
  const headerId = `header-${id}`;

  if (!visible) {
    return null;
  }

  const parent = parents.slice(-1)[0];
  const thisAndParents = [...parents, presentationNodeHash];

  // "CategorySet" DestinyPresentationScreenStyle is for armor sets
  const aParentIsCategorySetStyle = thisAndParents.some(
    (p) =>
      p > 0 &&
      defs.PresentationNode.get(p)?.screenStyle === DestinyPresentationScreenStyle.CategorySets,
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

  const title = (
    <PresentationNodeTitle
      displayProperties={node}
      overrideName={overrideName}
      titleInfo={node.titleInfo}
    />
  );

  const titleClassName = clsx({
    [styles.completed]: completed,
  });
  const nodeProgress = <PresentationNodeProgress acquired={acquired} visible={visible} />;

  return (
    <div
      className={clsx(styles.presentationNode, {
        [styles.onlyChild]: onlyChild,
        'always-expanded': alwaysExpanded,
      })}
    >
      {alwaysExpanded ? (
        <h4
          className={clsx(styles.alwaysExpanded, {
            [styles.completed]: completed,
          })}
        >
          {title}
          {nodeProgress}
        </h4>
      ) : (
        !onlyChild &&
        !isRootNode && (
          <Title
            title={title}
            collapsed={!childrenExpanded}
            extra={nodeProgress}
            className={titleClassName}
            headerId={headerId}
            contentId={contentId}
            onClick={expandChildren}
            ref={headerRef}
          />
        )
      )}
      <CollapsedSection collapsed={!childrenExpanded} headerId={headerId} contentId={contentId}>
        {node.childPresentationNodes?.map((subNode) => (
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
        {visible > 0 && (
          <PresentationNodeLeaf
            node={node}
            ownedItemHashes={ownedItemHashes}
            redactedRecordsRevealed={redactedRecordsRevealed}
            sortRecordProgression={sortRecordProgression}
          />
        )}
      </CollapsedSection>
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
      path.at(-1) === presentationNodeHash &&
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
function PresentationNodeProgress({ acquired, visible }: { acquired: number; visible: number }) {
  return (
    <div className={styles.nodeProgress}>
      <div>
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

function PresentationNodeTitle({
  displayProperties,
  overrideName,
  titleInfo,
}: {
  displayProperties: { name: string; icon: string };
  overrideName?: string;
  titleInfo?: DimTitle;
}) {
  return (
    <>
      {displayProperties.icon && (
        <BungieImage
          src={displayProperties.icon}
          className={clsx(styles.nodeImg, {
            [styles.incompleteTitleIcon]: titleInfo && !titleInfo.isCompleted,
          })}
        />
      )}
      {overrideName || displayProperties.name}
      {titleInfo && titleInfo.gildedNum > 0 && (
        <>
          <span
            className={clsx(styles.isGilded, {
              [styles.gildedThisSeason]: titleInfo.isGildedForCurrentSeason,
            })}
          >
            {String.fromCodePoint(FontGlyphs.gilded_title)}
            {titleInfo.gildedNum > 1 && (
              <span className={styles.gildedNum}>{titleInfo.gildedNum}</span>
            )}
          </span>
        </>
      )}
    </>
  );
}
