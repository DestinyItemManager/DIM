import { settingsSelector } from 'app/dim-api/selectors';
import { scrollToPosition } from 'app/dim-ui/scroll';
import { RootState } from 'app/store/types';
import { DestinyPresentationScreenStyle } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { deepEqual } from 'fast-equals';
import React, { useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import BungieImage from '../dim-ui/BungieImage';
import { setSetting } from '../settings/actions';
import { percent } from '../shell/filters';
import { AppIcon, collapseIcon, expandIcon } from '../shell/icons';
import { DimPresentationNode } from './presentation-nodes';
import './PresentationNode.scss';
import PresentationNodeLeaf from './PresentationNodeLeaf';

interface StoreProps {
  completedRecordsHidden: boolean;
  redactedRecordsRevealed: boolean;
}

interface ProvidedProps {
  node: DimPresentationNode;
  defs: D2ManifestDefinitions;
  ownedItemHashes?: Set<number>;
  path: number[];
  parents: number[];
  isInTriumphs?: boolean;
  overrideName?: string;
  isRootNode?: boolean;
  onNodePathSelected(nodePath: number[]): void;
}

function mapStateToProps(state: RootState): StoreProps {
  const settings = settingsSelector(state);
  return {
    completedRecordsHidden: settings.completedRecordsHidden,
    redactedRecordsRevealed: settings.redactedRecordsRevealed,
  };
}
const mapDispatchToProps = {
  setSetting,
};

type DispatchProps = typeof mapDispatchToProps;
type Props = StoreProps & ProvidedProps & DispatchProps;

function PresentationNode({
  node,
  defs,
  ownedItemHashes,
  path,
  parents,
  completedRecordsHidden,
  redactedRecordsRevealed,
  onNodePathSelected,
  isInTriumphs,
  isRootNode,
  overrideName,
}: Props) {
  const headerRef = useRef<HTMLDivElement>(null);
  const lastPath = useRef<number[]>();
  const presentationNodeHash = node.nodeDef.hash;

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

  const expandChildren = () => {
    const childrenExpanded = path.includes(presentationNodeHash);
    onNodePathSelected(childrenExpanded ? parents : [...parents, presentationNodeHash]);
    return false;
  };

  const { visible, acquired, nodeDef } = node;
  const completed = Boolean(acquired >= visible);

  if (!visible) {
    return null;
  }

  // TODO: use nodes as parents?
  const parent = parents.slice(-1)[0];
  const thisAndParents = [...parents, presentationNodeHash];

  // "CategorySet" DestinyPresentationScreenStyle is for armor sets
  const aParentIsCategorySetStyle = thisAndParents.some(
    (p) => defs.PresentationNode.get(p).screenStyle === DestinyPresentationScreenStyle.CategorySets
  );

  // todo: export this hash/depth and clean up the boolean string
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

  // TODO: need more info on what iconSequences are

  const title = (
    <span className="node-name">
      {nodeDef.displayProperties.icon && <BungieImage src={nodeDef.displayProperties.icon} />}{' '}
      {overrideName || nodeDef.displayProperties.name}
    </span>
  );

  return (
    <div
      className={clsx('presentation-node', {
        'only-child': onlyChild,
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
          <div className="node-progress">
            <div className="node-progress-count">
              {acquired} / {visible}
            </div>
            <div className="node-progress-bar">
              <div
                className="node-progress-bar-amount"
                style={{ width: percent(acquired / visible) }}
              />
            </div>
          </div>
        </div>
      )}
      {childrenExpanded &&
        node.childPresentationNodes?.map((subNode) => (
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          <ConnectedPresentationNode
            key={subNode.nodeDef.hash}
            node={subNode}
            defs={defs}
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
          defs={defs}
          ownedItemHashes={ownedItemHashes}
          completedRecordsHidden={completedRecordsHidden}
          redactedRecordsRevealed={redactedRecordsRevealed}
        />
      )}
    </div>
  );
}

// This will be set to the connected (via redux) version of the component
const ConnectedPresentationNode = connect<StoreProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(PresentationNode);

export default ConnectedPresentationNode;
