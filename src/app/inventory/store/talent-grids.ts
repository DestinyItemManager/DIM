import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DestinyItemComponent, DestinyItemTalentGridComponent } from 'bungie-api-ts/destiny2';
import { DimTalentGrid, DimGridNode } from '../item-types';
import _ from 'lodash';
import { chainComparator, compareBy } from 'app/utils/comparators';

/**
 * These are the utilities that deal with talent grids. Talent grids are mostly deprecated
 * in favor of sockets, but they're still used to define subclasses.
 *
 * This is called from within d2-item-factory.service.ts
 */

export function buildTalentGrid(
  item: DestinyItemComponent,
  talentsMap: { [key: string]: DestinyItemTalentGridComponent },
  defs: D2ManifestDefinitions
): DimTalentGrid | null {
  if (!item.itemInstanceId || !talentsMap[item.itemInstanceId]) {
    return null;
  }
  const talentGrid = talentsMap[item.itemInstanceId];
  if (!talentGrid) {
    return null;
  }

  if (!talentGrid.nodes.length) {
    // early short-circuit
    return null;
  }

  const talentGridDef = defs.TalentGrid.get(talentGrid.talentGridHash);
  if (!talentGridDef || !talentGridDef.nodes || !talentGridDef.nodes.length) {
    return null;
  }

  const gridNodes = _.compact(
    talentGrid.nodes.map((node): DimGridNode | undefined => {
      const talentNodeGroup = talentGridDef.nodes[node.nodeIndex];
      const talentNodeSelected = talentNodeGroup.steps[0];

      if (!talentNodeSelected) {
        return undefined;
      }

      const nodeName = talentNodeSelected.displayProperties.name;

      // Filter out some weird bogus nodes
      if (!nodeName || nodeName.length === 0 || talentNodeGroup.column < 0) {
        return undefined;
      }

      // Only one node in this column can be selected (scopes, etc)
      const exclusiveInColumn = Boolean(
        talentNodeGroup.exclusiveWithNodeHashes &&
          talentNodeGroup.exclusiveWithNodeHashes.length > 0
      );

      const activatedAtGridLevel = talentNodeSelected.activationRequirement.gridLevel;

      // There's a lot more here, but we're taking just what we need
      return {
        name: nodeName,
        hash: talentNodeSelected.nodeStepHash,
        description: talentNodeSelected.displayProperties.description,
        icon: talentNodeSelected.displayProperties.icon,
        // Position in the grid
        column: talentNodeGroup.column / 8,
        row: talentNodeGroup.row / 8,
        // Is the node selected (lit up in the grid)
        activated: node.isActivated,
        // The item level at which this node can be unlocked
        activatedAtGridLevel,
        // Only one node in this column can be selected (scopes, etc)
        exclusiveInColumn,
        // Whether or not the material cost has been paid for the node
        unlocked: true,
        // Some nodes don't show up in the grid, like purchased ascend nodes
        hidden: node.hidden
      };
    })
  );

  if (!gridNodes.length) {
    return null;
  }

  // Fix for stuff that has nothing in early columns
  const minByColumn = _.minBy(
    gridNodes.filter((n) => !n.hidden),
    (n) => n.column
  )!;
  const minColumn = minByColumn.column;
  if (minColumn > 0) {
    gridNodes.forEach((node) => {
      node.column -= minColumn;
    });
  }

  return {
    nodes: gridNodes.sort(
      chainComparator(
        compareBy((node) => node.column),
        compareBy((node) => node.row)
      )
    ),
    complete: gridNodes.every((n) => n.unlocked)
  };
}
