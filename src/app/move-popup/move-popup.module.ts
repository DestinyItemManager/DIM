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
import { ItemPopup } from './item-popup.directive';
import { PressTip } from './press-tip.directive';
import { ammoTypeClass } from './ammo-type';
import { PercentWidth } from '../inventory/dimPercentWidth.directive';
import 'angularjs-slider';

export default module('movePopupModule', ['rzModule'])
  .component('dimItemStats', ItemStatsComponent)
  .component('dimItemTag', ItemTagComponent)
  .directive('dimMoveAmount', MoveAmount)
  .component('dimObjectives', ObjectivesComponent)
  .component('dimFlavorObjective', FlavorObjectiveComponent)
  .component('dimMoveItemProperties', MoveItemPropertiesComponent)
  .component('dimMoveLocations', MoveLocationsComponent)
  .component('dimMovePopup', MovePopupComponent)
  .component('dimTalentGrid', TalentGridComponent)
  .filter('talentGridNodes', () => talentGridNodesFilter)
  .filter('ammoTypeClass', () => ammoTypeClass)
  .directive('itemPopup', ItemPopup)
  .directive('dimPercentWidth', PercentWidth)
  .directive('pressTip', PressTip).name;
