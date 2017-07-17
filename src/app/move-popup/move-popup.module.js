import angular from 'angular';
import { ItemStatsComponent } from './dimItemStats.component';
import { ItemTagComponent } from './dimItemTag.directive';
import { MoveAmount } from './dimMoveAmount.directive';
import { ObjectivesComponent } from './objectives.component';
import { MoveItemProperties } from './dimMoveItemProperties.directive';
import { MovePopupComponent } from './dimMovePopup.directive';
import { talentGridNodesFilter, TalentGrid } from './dimTalentGrid.directive';
import { ItemPopup } from './item-popup.directive';
import { PressTip } from './press-tip.directive';

export default angular
  .module('movePopupModule', [])
  .component('dimItemStats', ItemStatsComponent)
  .component('dimItemTag', ItemTagComponent)
  .directive('dimMoveAmount', MoveAmount)
  .component('dimObjectives', ObjectivesComponent)
  .directive('dimMoveItemProperties', MoveItemProperties)
  .component('dimMovePopup', MovePopupComponent)
  .directive('dimTalentGrid', TalentGrid)
  .filter('talentGridNodes', () => talentGridNodesFilter)
  .directive('itemPopup', ItemPopup)
  .directive('pressTip', PressTip)
  .name;