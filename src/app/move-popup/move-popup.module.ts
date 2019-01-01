import { module } from 'angular';
import { PercentWidth } from '../inventory/dimPercentWidth.directive';
import { react2angular } from 'react2angular';
import ItemMoveAmount from '../item-popup/ItemMoveAmount';
import ItemTalentGrid from '../item-popup/ItemTalentGrid';

export default module('movePopupModule', [])
  .component(
    'dimMoveAmount',
    react2angular(ItemMoveAmount, ['amount', 'maximum', 'maxStackSize', 'onAmountChanged'])
  )
  .component('dimTalentGrid', react2angular(ItemTalentGrid, ['talentGrid', 'perksOnly']))
  .directive('dimPercentWidth', PercentWidth).name;
