import { module } from 'angular';
import { ItemStatsComponent } from './item-stats.component';
import { ItemTagComponent } from './item-tag.component';
import { MoveAmount } from './move-amount.directive';
import { ObjectivesComponent } from './objectives.component';
import { FlavorObjectiveComponent } from './flavor-objective.component';
import { MoveItemPropertiesComponent } from './dimMoveItemProperties.directive';
import { MovePopupComponent } from './dimMovePopup.directive';
import { MoveLocationsComponent } from './move-locations.component';
import { talentGridNodesFilter, TalentGridComponent } from './talent-grid.component';
import Sockets from './Sockets';
import { ItemPopup } from './item-popup.directive';
import { PressTip } from './press-tip.directive';
import { react2angular } from 'react2angular';

export default module('movePopupModule', [])
  .component('dimItemStats', ItemStatsComponent)
  .component('dimItemTag', ItemTagComponent)
  .directive('dimMoveAmount', MoveAmount)
  .component('dimObjectives', ObjectivesComponent)
  .component('dimFlavorObjective', FlavorObjectiveComponent)
  .component('dimMoveItemProperties', MoveItemPropertiesComponent)
  .component('dimMoveLocations', MoveLocationsComponent)
  .component('dimMovePopup', MovePopupComponent)
  .component('dimTalentGrid', TalentGridComponent)
  .component('sockets', react2angular(Sockets, ['item'], ['$scope']))
  .filter('talentGridNodes', () => talentGridNodesFilter)
  .directive('itemPopup', ItemPopup)
  .directive('pressTip', PressTip)
  .name;
