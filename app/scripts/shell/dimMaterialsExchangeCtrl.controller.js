(function () {
    'use strict';

    angular.module('dimApp').controller('dimMaterialsExchangeCtrl', MaterialsController);

    MaterialsController.$inject = ['$scope', 'dimItemService', 'dimStoreService', 'dimInfoService'];

    function MaterialsController($scope, dimItemService, dimStoreService, dimInfoService) {
        var vm = this;

        var materialsHashes = [
            211861343,  // heavy ammo synth
            928169143,  // special ammo synth
            937555249,  // motes of light
            1542293174, // armor materials
            1898539128  // weapon parts
        ];

        var planataryMatsHashes = [
            1797491610, // Helium Filaments
            2882093969, // Spin Metal
            3242866270, // Relic Iron
            2254123540, // Spirit Bloom
            3164836592, // Wormspore
        ];

        var xurMatsHashes = [
            1738186005, // strange coins
            211861343  // heavy ammo synth
        ];

        vm.xurMats = mapXurItems(xurMatsHashes);
        vm.planataryMats = mapItems(planataryMatsHashes);
        vm.materials = mapItems(materialsHashes);

        function mapItems(hashes) {
            return hashes.map(function (hash) {
                var ret = angular.copy(dimItemService.getItem({
                    hash: hash
                }));
                if (ret) {
                    ret.amount = 0;
                    dimStoreService.getStores().forEach(function (s) {
                        ret.amount += s.amountOfItem(ret);
                    });
                }
                return ret;
            }).filter((item) => !_.isUndefined(item));
        }

        function mapXurItems(hashes) {
            var mappedItems = mapItems(hashes);
            mappedItems[1].amount = mappedItems[0].amount * 3;

            return mappedItems;
        }
    }
})();
