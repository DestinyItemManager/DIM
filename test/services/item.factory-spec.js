describe("Unit: Testing Services", function () {
  describe("Search Service:", function () {
    var service, $q, $rootScope;
    var vaultItem, guardianItem, vaultStore, guardianStore;

    var trueResult = function (result) {
      expect(result)
        .toBe(true);
    };

    var falseResult = function (result) {
      expect(result)
        .toBe(false);
    };

    var expectUndefinedResult = function(result) {
      expect(result).toBeUndefined();
    };

    beforeEach(function () {
      module('dimApp');
    });

    beforeEach(
      inject(function (dimItemService, $q, $rootScope) {
        service = dimItemService;
        q = $q;
        rootScope = $rootScope;
      }));

    beforeEach(function() {
      vaultItem = {
        owner: 'vault'
      };
      guardianItem = {
        owner: '1'
      };
      vaultStore = {
        id: 'vault'
      };
      guardianStore = {
        id: '1'
      };
    });

    it('should contain a searchService', function () {
      expect(service)
        .toBeDefined();
    });

    it('should contain a test object', function () {
      expect(service.__test__)
        .toBeDefined();
    });

    it('should a method to test vault to vault transfers.', function () {
      expect(service.__test__.isValidTransfer)
        .toBeDefined();
    });

    it('should test for move operations that are vault to vault.', function (done) {
      service.__test__.isValidTransfer(vaultItem, vaultStore)
        .then(expectUndefinedResult)
        .catch(falseResult)
        .finally(done);

      rootScope.$digest();
    });

    it('should test for move operations that are vault to guardian.', function (done) {
      service.__test__.isValidTransfer(vaultItem, guardianStore)
        .then(trueResult)
        .catch(expectUndefinedResult)
        .finally(done);

      rootScope.$digest();
    });

    it('should test for move operations that are guardian to vault.', function (done) {
      service.__test__.isValidTransfer(guardianItem, vaultStore)
        .then(trueResult, fail)
        .catch(expectUndefinedResult)
        .finally(done);

      rootScope.$digest();
    });

    it('should test for move operations that are guardian to guardian.', function (done) {
      service.__test__.isValidTransfer(guardianItem, guardianStore)
        .then(trueResult)
        .catch(expectUndefinedResult)
        .finally(done);

      rootScope.$digest();
    });

    it('should test for move operations that are invalid (null or undefined).', function () {
      var prebaked = service.__test__.isValidTransfer.bind(null, null, undefined);

      expect(prebaked).toThrow();
    });

  });

});
