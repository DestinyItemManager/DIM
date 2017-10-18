import angular from 'angular';
import { ItemStatsComponent } from './item-stats.component';
import { ItemTagComponent } from './item-tag.component';
import { MoveAmount } from './move-amount.directive';
import { ObjectivesComponent } from './objectives.component';
import { MoveItemProperties } from './dimMoveItemProperties.directive';
import { MovePopupComponent } from './dimMovePopup.directive';
import { talentGridNodesFilter, TalentGridComponent } from './talent-grid.component';
import { SocketsComponent } from './sockets.component';
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
  .component('dimTalentGrid', TalentGridComponent)
  .component('sockets', SocketsComponent)
  .filter('talentGridNodes', () => talentGridNodesFilter)
  .directive('itemPopup', ItemPopup)
  .directive('pressTip', PressTip)
  .name;