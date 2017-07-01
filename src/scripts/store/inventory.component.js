import template from './inventory.html';

export default {
  template,
  bindings: {
    destinyMembershipId: '<',
    platformType: '<'
  },
  controller: InventoryController
};

function InventoryController() {
  'ngInject';

  // TODO: This should probably be the top level destiny1 component

  this.$onInit = function() {
    console.log(this.destinyMembershipId, this.platformType);
  };
}