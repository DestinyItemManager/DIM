import React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import './PresentationNode.scss';
import Collectible from './Collectible';
import { DestinyProfileResponse, DestinyPresentationScreenStyle } from 'bungie-api-ts/destiny2';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import BungieImage from '../dim-ui/BungieImage';
import Record from './Record';
import clsx from 'clsx';
import { expandIcon, collapseIcon, AppIcon } from '../shell/icons';
import { deepEqual } from 'fast-equals';
import { percent } from '../shell/filters';
import { scrollToPosition } from 'app/dim-ui/scroll';
import { setSetting } from '../settings/actions';
import { RootState } from '../store/reducers';
import Checkbox from '../settings/Checkbox';
import { connect } from 'react-redux';
import { t } from 'app/i18next-t';

/** root PresentationNodes to lock in expanded state */
const rootNodes = [3790247699];

interface StoreProps {
  completedRecordsHidden: boolean;
  redactedRecordsRevealed: boolean;
}
interface ProvidedProps {
  presentationNodeHash: number;
  defs: D2ManifestDefinitions;
  buckets?: InventoryBuckets;
  profileResponse: DestinyProfileResponse;
  ownedItemHashes?: Set<number>;
  path: number[];
  parents: number[];
  collectionCounts: {
    [nodeHash: number]: {
      acquired: number;
      visible: number;
    };
  };
  onNodePathSelected(nodePath: number[]): void;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    completedRecordsHidden: state.settings.completedRecordsHidden,
    redactedRecordsRevealed: state.settings.redactedRecordsRevealed
  };
}
const mapDispatchToProps = {
  setSetting
};

type DispatchProps = typeof mapDispatchToProps;
type Props = StoreProps & ProvidedProps & DispatchProps;
function isInputElement(element: HTMLElement): element is HTMLInputElement {
  return element.nodeName === 'INPUT';
}

class PresentationNode extends React.Component<Props> {
  private headerRef = React.createRef<HTMLDivElement>();
  private lastPath: number[];

  componentDidUpdate() {
    if (
      this.headerRef.current &&
      this.props.path[this.props.path.length - 1] === this.props.presentationNodeHash &&
      !deepEqual(this.lastPath, this.props.path)
    ) {
      const clientRect = this.headerRef.current.getBoundingClientRect();
      scrollToPosition({
        top: window.scrollY + clientRect.top - 50,
        left: 0,
        behavior: 'smooth'
      });
    }
    this.lastPath = this.props.path;
  }
  render() {
    const {
      presentationNodeHash,
      defs,
      profileResponse,
      buckets,
      ownedItemHashes,
      path,
      parents,
      completedRecordsHidden,
      redactedRecordsRevealed,
      collectionCounts,
      onNodePathSelected
    } = this.props;
    const presentationNodeDef = defs.PresentationNode.get(presentationNodeHash);
    if (presentationNodeDef.redacted) {
      return null;
    }

    if (!presentationNodeDef) {
      return (
        <div className="dim-error">
          <h2>Bad presentation node</h2>
          <div>This isn't real {presentationNodeHash}</div>
        </div>
      );
    }

    const { visible, acquired } = collectionCounts[presentationNodeHash];
    const completed = Boolean(acquired >= visible);

    if (!visible) {
      return null;
    }

    const parent = parents.slice(-1)[0];
    const thisAndParents = [...parents, presentationNodeHash];

    // "CategorySet" DestinyPresentationScreenStyle is for armor sets
    const aParentIsCategorySetStyle = thisAndParents.some(
      (p) =>
        defs.PresentationNode.get(p).screenStyle === DestinyPresentationScreenStyle.CategorySets
    );

    // todo: export this hash/depth and clean up the boolean string
    const alwaysExpanded =
      // if we're not in triumphs
      (thisAndParents[0] !== 1024788583 &&
        // & we're 4 levels deep(collections:weapon), or in CategorySet & 5 deep (collections:armor)
        thisAndParents.length >= (aParentIsCategorySetStyle ? 5 : 4)) ||
      // or this is manually selected to be forced expanded
      rootNodes.includes(presentationNodeHash);

    const onlyChild =
      // if this is a child of a child
      parents.length > 0 &&
      // and has no siblings
      defs.PresentationNode.get(parent).children.presentationNodes.length === 1;

    /** whether this node's children are currently shown */
    const childrenExpanded = onlyChild || path.includes(presentationNodeHash) || alwaysExpanded;

    /** Display the item as a category, through which sub-items are filtered. */
    const displayStyle = {
      0: 'Category',
      1: 'Badge',
      2: 'Medals',
      3: 'Collectible',
      4: 'Record'
    };

    const screenStyle = {
      0: 'Default',
      1: 'CategorySets',
      2: 'Badge'
    };

    const nodeStyle = {
      0: 'Default',
      1: 'Category',
      2: 'Collectibles',
      3: 'Records'
    };

    const title = (
      <span className="node-name">
        {presentationNodeDef.displayProperties.icon && (
          <BungieImage src={presentationNodeDef.displayProperties.icon} />
        )}{' '}
        {presentationNodeDef.displayProperties.name}
      </span>
    );

    return (
      <div
        className={clsx(
          'presentation-node',
          `display-style-${displayStyle[presentationNodeDef.displayStyle]}`,
          `screen-style-${screenStyle[presentationNodeDef.screenStyle]}`,
          `node-style-${nodeStyle[presentationNodeDef.nodeType]}`,
          `level-${thisAndParents.length}`,
          {
            'only-child': onlyChild,
            'always-expanded': alwaysExpanded
          }
        )}
      >
        {!onlyChild && (
          <div
            className={clsx('title', {
              collapsed: !childrenExpanded,
              'hide-complete': completedRecordsHidden,
              completed
            })}
            onClick={this.expandChildren}
            ref={this.headerRef}
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
        {childrenExpanded && presentationNodeHash === 1024788583 && (
          <div className="presentationNodeOptions">
            <Checkbox
              label={t('Triumphs.HideCompleted')}
              name="completedRecordsHidden"
              value={completedRecordsHidden}
              onChange={this.onChange}
            />
            <Checkbox
              label={t('Triumphs.RevealRedacted')}
              name="redactedRecordsRevealed"
              value={redactedRecordsRevealed}
              onChange={this.onChange}
            />
          </div>
        )}
        {childrenExpanded &&
          presentationNodeDef.children.presentationNodes.map((node) => (
            <ConnectedPresentationNode
              key={node.presentationNodeHash}
              presentationNodeHash={node.presentationNodeHash}
              defs={defs}
              profileResponse={profileResponse}
              buckets={buckets}
              ownedItemHashes={ownedItemHashes}
              path={path}
              parents={thisAndParents}
              onNodePathSelected={onNodePathSelected}
              collectionCounts={collectionCounts}
            />
          ))}
        {childrenExpanded && visible > 0 && (
          <>
            {presentationNodeDef.children.collectibles.length > 0 && (
              <div className="collectibles">
                {buckets &&
                  presentationNodeDef.children.collectibles.map((collectible) => (
                    <Collectible
                      key={collectible.collectibleHash}
                      collectibleHash={collectible.collectibleHash}
                      defs={defs}
                      profileResponse={profileResponse}
                      buckets={buckets}
                      ownedItemHashes={ownedItemHashes}
                    />
                  ))}
              </div>
            )}
            {presentationNodeDef.children.records.length > 0 && (
              <div className="records">
                {presentationNodeDef.children.records.map((record) => (
                  <Record
                    key={record.recordHash}
                    recordHash={record.recordHash}
                    defs={defs}
                    profileResponse={profileResponse}
                    completedRecordsHidden={completedRecordsHidden}
                    redactedRecordsRevealed={redactedRecordsRevealed}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  private onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    if (isInputElement(e.target) && e.target.type === 'checkbox') {
      this.props.setSetting(e.target.name as any, e.target.checked);
    }
  };

  private expandChildren = () => {
    const { presentationNodeHash, parents, path } = this.props;
    const childrenExpanded =
      path.includes(presentationNodeHash) || rootNodes.includes(presentationNodeHash);
    this.props.onNodePathSelected(childrenExpanded ? parents : [...parents, presentationNodeHash]);
    return false;
  };
}

// This will be set to the connected (via redux) version of the component
const ConnectedPresentationNode = connect<StoreProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(PresentationNode);

export default ConnectedPresentationNode;
