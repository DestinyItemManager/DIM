import angular from 'angular';

import UIRouterModule from '@uirouter/angularjs';

import { ActivityTrackerDirective, ActivityTrackerService } from './activity-tracker';
import contentComponent from './content/content.component';
import { RefreshComponent } from './refresh.component';
import { CountdownComponent } from './countdown.component';
import { BungieAlertsComponent } from './bungie-alerts.component';
import { StarRatingComponent } from './star-rating/star-rating.component';
import { ScrollClass } from './scroll-class.directive';

export const ShellModule = angular
  .module('dimShell', [
    UIRouterModule
  ])
  .directive('dimActivityTracker', ActivityTrackerDirective)
  .service('dimActivityTrackerService', ActivityTrackerService)
  .component('bungieAlerts', BungieAlertsComponent)
  .component('refresh', RefreshComponent)
  .component('content', contentComponent)
  .component('countdown', CountdownComponent)
  .component('starRating', StarRatingComponent)
  .directive('scrollClass', ScrollClass)
  .config(($stateProvider, $urlServiceProvider) => {
    'ngInject';

    // TODO: move this out of the module
    // A dummy state that'll redirect to the selected character's inventory
    $stateProvider.state({
      name: 'destiny1',
      url: '/d1',
      resolve: {
        activeAccount: (dimPlatformService) => {
          'ngInject';
          return dimPlatformService.getPlatforms().then(() => dimPlatformService.getActive());
        }
      },
      controller: ($state, activeAccount) => {
        'ngInject';
        // TODO: make sure it's a D1 platform, replicate this at the top level
        if (activeAccount) {
          $state.go('inventory', activeAccount);
        } else {
          // A bit awkward, but getPlatforms should already have redirected to login
        }
      }
    });

    // destiny1account state is the base for "full" DIM views with a header that operate in the context of a particular Destiny 1 account.
    // TODO: move this, and/or replace "content" with this
    // TODO: use https://github.com/angular-ui/ui-router/wiki/Multiple-Named-Views to inject stuff into header
    $stateProvider.state({
      name: 'destiny1account',
      abstract: true,
      url: '/d1/:membershipId-{platformType:int}',
      component: 'content', // TODO: rename the component
      resolve: {
        // TODO: move this to platform/account service
        account: ($transition$, dimPlatformService, $state) => {
          'ngInject';

          const { membershipId, platformType } = $transition$.params();

          // TODO: shouldn't need to load all platforms for this. How can we avoid that?
          return dimPlatformService.getPlatforms()
            .then(() => {
              // TODO: getPlatformMatching should be able to load an account that we don't know
              // TODO: make sure it's a "real" account
              const account = dimPlatformService.getPlatformMatching({
                membershipId,
                platformType,
                destinyVersion: 1
              });
              if (!account) {
                // If we didn't load an account, kick out and re-resolve
                if (!account) {
                  $state.go('destiny1');
                }
              }
              dimPlatformService.setActive(account);
              return account;
            });
        }
      }
    });

    $urlServiceProvider.rules.when('/d1/', '/d1');
    $urlServiceProvider.rules.when('/d1/:membershipId-:platformType/', '/d1/:membershipId-:platformType/inventory');
    $urlServiceProvider.rules.when('/d1/:membershipId-:platformType', '/d1/:membershipId-:platformType/inventory');
  })
  .name;
