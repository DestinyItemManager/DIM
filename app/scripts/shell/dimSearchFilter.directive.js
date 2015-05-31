(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimSearchFilter', SearchFilter);

  SearchFilter.$inject = [];

  function SearchFilter() {
    return {
      controller: SearchFilterCtrl,
      controllerAs: 'vm',
      bindToController: true,
      restrict: 'A',
      template: [
        '<input placeholder="filter items or is:arc" type="search" name="filter" ng-model="vm.search" ng-model-options="{ debounce: 500 }" ng-trim="true" ng-change="vm.filter()">'
      ].join('')
    };
  }

  SearchFilterCtrl.$inject = ['$scope', 'dimStoreService', '$timeout'];

  function SearchFilterCtrl($scope, dimStoreService, $timeout) {
    var vm = this;

    $scope.$on('dim-stores-updated', function(arg) {
      vm.filter();
    });

    vm.filter = function() {

      var filterValue = (vm.search) ? vm.search.toLowerCase() : '';
      var filterResults;
      var filterResult = '';
      var filterFn;
      var tempFns = [];
      var special = filterValue.indexOf('is:') >= 0;

      if (special) {
        filterResults = filterValue.split('is:');

        _.each(filterResults, function(filterResult) {
          filterResult = filterResult.trim();

          if (filterResult !== '') {
            if (['arc', 'solar', 'void', 'kinetic'].indexOf(filterResult) >= 0) {
              special = 'elemental';
            } else if (['primary', 'special', 'heavy', 'helmet', 'leg', 'gauntlets', 'chest', 'class', 'classitem'].indexOf(filterResult) >= 0) {
              special = 'type';
            } else if (['common', 'uncommon', 'rare', 'legendary', 'exotic'].indexOf(filterResult) >= 0) {
              special = 'tier';
            } else if (['incomplete'].indexOf(filterResult) >= 0) {
              special = 'incomplete';
            } else if (['complete'].indexOf(filterResult) >= 0) {
              special = 'complete';
            } else if (['xpincomplete'].indexOf(filterResult) >= 0) {
              special = 'xpincomplete';
            } else if (['xpcomplete'].indexOf(filterResult) >= 0) {
              special = 'xpcomplete';
            } else if (['upgraded'].indexOf(filterResult) >= 0) {
              special = 'upgraded';
            } else if (['titan', 'hunter', 'warlock'].indexOf(filterResult) >= 0) {
              special = 'classType';
            } else if (['dupe', 'duplicate'].indexOf(filterResult) >= 0) {
              special = 'dupe';
            } else if (['unascended', 'unassended', 'unasscended'].indexOf(filterResult) >= 0) {
              special = 'unascended';
            } else if (['ascended', 'assended', 'asscended'].indexOf(filterResult) >= 0) {
              special = 'ascended';
            } else if (['locked'].indexOf(filterResult) >= 0) {
              special = 'locked';
            } else if (['unlocked'].indexOf(filterResult) >= 0) {
              special = 'unlocked';
            }

            tempFns.push(filterGenerator(filterResult, special));
          }
        });
      } else {
        tempFns.push(filterGenerator(filterValue, ''));
      }

      filterFn = function(item) {
        return (_.reduce(tempFns, function(memo, fn) {
          return memo || fn(item);
        }, false));
      };

      _.each(dimStoreService.getStores(), function(store) {
        _.chain(store.items)
          .each(function(item) {
            item.visible = true; // resets the visiblity
          })
          .filter(filterFn)
          .each(function(item) {
            item.visible = false; // hides it if it passes
          });
      });

      $timeout(dimStoreService.setHeights, 32);
    };

    var filterGenerator = function(predicate, switchParam) {
      var   _duplicates = {};

      var result = function(predicate, item) {
        return true;
      };

      switch (switchParam) {
        case 'elemental':
          {
            result = function(p, item) {
              return (item.dmg !== p);
            };
            break;
          }
        case 'type':
          {
            result = function(p, item) {
              return (item.type.toLowerCase() !== p);
            };
            break;
          }
        case 'tier':
          {
            result = function(p, item) {
              return (item.tier.toLowerCase() !== p);
            };
            break;
          }
        case 'incomplete':
          {
            result = function(p, item) {
              return ((item.complete === true || (!item.primStat && item.type !== 'Class') || item.type === 'Vehicle' || (item.tier === 'Common' && item.type !== 'Class')) || ((item.xpComplete && item.hasXP) || (!item.hasXP)));
            };
            break;
          }
        case 'complete':
          {
            result = function(p, item) {
              return (item.complete === false) || (!item.primStat && item.type !== 'Class') || item.type === 'Vehicle' || (item.tier === 'Common' && item.type !== 'Class');
            };
            break;
          }
        case 'xpincomplete':
          {
            result = function(p, item) {
              return (item.xpComplete && item.hasXP) || (!item.hasXP);
            };
            break;
          }
        case 'xpcomplete':
          {
            result = function(p, item) {
              return (!item.xpComplete && item.hasXP) || (!item.hasXP);
            };
            break;
          }
        case 'unascended':
          {
            result = function(p, item) {
              return (!item.hasAscendNode || item.ascended);
            };
            break;
          }
        case 'ascended':
          {
            result = function(p, item) {
              return (!item.hasAscendNode || !item.ascended);
            };
            break;
          }
        case 'unlocked':
          {
            result = function(p, item) {
              return (!item.lockable || item.locked);
            };
            break;
          }
        case 'locked':
          {
            result = function(p, item) {
              return (!item.lockable || !item.locked);
            };
            break;
          }
        case 'upgraded':
          {
            result = function(p, item) {
              return ((item.complete === true || (!item.primStat && item.type !== 'Class') || item.type === 'Vehicle' || (item.tier === 'Common' && item.type !== 'Class')) || ((!item.xpComplete && item.hasXP) || (!item.hasXP)));
            };
            break;
            }
          case 'dupe':
            {
              result = function(p, item) {
                if (!_duplicates.hasOwnProperty('dupes')) {
                  var allItems = _.chain(dimStoreService.getStores())
                    .map(function(store) {
                      return store.items;
                    })
                    .flatten()
                    .sortBy('hash')
                    .value();

                  _duplicates.dupes = [];

                  for (var i = 0; i < allItems.length - 1; i++) {
                    if (allItems[i + 1].hash == allItems[i].hash) {
                      _duplicates.dupes.push(allItems[i].hash);
                    }
                  }
                }

                return !_.some(_duplicates.dupes, function(hash) { return item.hash === hash; });
              };
              break;
            }
        case 'classType':
          {
            result = function(p, item) {
              var value;

              switch (p) {
                case 'titan':
                  value = 0;
                  break;
                case 'hunter':
                  value = 1;
                  break;
                case 'warlock':
                  value = 2;
                  break;
              }

              return (item.classType !== value);
            };
            break;
          }
        default:
          {
            result = function(p, item) {
              return (item.name.toLowerCase()
                .indexOf(p) === -1);
            };
          }
      }

      return result.bind(null, predicate);
    };

    // function outerHeight(el) {
    //   var height = el.offsetHeight;
    //   var style = getComputedStyle(el);
    //
    //   height += parseInt(style.marginTop) + parseInt(style.marginBottom);
    //   return height;
    // }
    //
    // function outerWidth(el) {
    //   var width = el.offsetWidth;
    //   var style = getComputedStyle(el);
    //
    //   width += parseInt(style.marginLeft) + parseInt(style.marginRight);
    //   return width;
    // }
    //
    // function cleanUI() {
    //   var weapons = document.querySelectorAll('.weapons');
    //   var armor = document.querySelectorAll('.armor');
    //
    //   var wHeight = _.reduce(weapons, function (memo, section) {
    //     var childHeight = 0;
    //     _.each(section.children, function(child) {
    //       childHeight += outerHeight(child);
    //     });
    //
    //
    //     if (childHeight > memo) {
    //       memo = childHeight;
    //     }
    //
    //     return memo;
    //   }, 0);
    //
    //   var aHeight = _.reduce(armor, function (memo, section) {
    //     var childHeight = 0;
    //     _.each(section.children, function(child) {
    //       childHeight += outerHeight(child);
    //     });
    //
    //
    //     if (childHeight > memo) {
    //       memo = childHeight;
    //     }
    //
    //     return memo;
    //   }, 0);
    //
    //   var style = document.createElement('style');
    //   style.type = 'text/css';
    //   style.innerHTML = '.armor { min-height: ' + (aHeight) + 'px; } .weapons { min-height: ' + (wHeight) + 'px; }';
    //   document.getElementsByTagName('head')[0].appendChild(style);
    // }
  }
})();
