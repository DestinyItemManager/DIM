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

  this.$onInit = function() {
    console.log(this.destinyMembershipId, this.platformType);
  };
}