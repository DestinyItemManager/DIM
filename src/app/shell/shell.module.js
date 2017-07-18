import angular from 'angular';

import UIRouterModule from '@uirouter/angularjs';

import { ActivityTrackerDirective, ActivityTrackerService } from './activity-tracker';
import { ContentComponent } from './content/content.component';
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
  .component('content', ContentComponent)
  .component('countdown', CountdownComponent)
  .component('starRating', StarRatingComponent)
  .directive('scrollClass', ScrollClass)
  .config(($stateProvider) => {
    'ngInject';

    // TODO: move this out of the module
    // A dummy state that'll redirect to the selected character's Destiny 1 inventory
    $stateProvider.state({
      name: 'default-account',
      resolve: {
        activeAccount: (dimPlatformService) => {
          'ngInject';
          return dimPlatformService.getPlatforms().then(() => dimPlatformService.getActive());
        }
      },
      controller: ($state, activeAccount) => {
        'ngInject';

        if (activeAccount) {
          // TODO: we won't know D1 vs. D1 until we try to load characters - load to a selection screen?
          $state.go('destiny1.inventory', activeAccount);
        } else {
          // A bit awkward, but getPlatforms should already have redirected to login
        }
      }
    });

    // destiny-account state is the base for "full" DIM views with a header that operate in the context of a particular Destiny account.
    // TODO: move this, and/or replace "content" with this
    // TODO: use https://github.com/angular-ui/ui-router/wiki/Multiple-Named-Views to inject stuff into header
    // TODO: make an actual page for this, with a version selector
    $stateProvider.state({
      name: 'destiny-account',
      redirectTo: 'destiny1.inventory',
      url: '/:membershipId-{platformType:int}',
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
                platformType
              });
              if (!account) {
                // If we didn't load an account, kick out and re-resolve
                if (!account) {
                  $state.go('default-account');
                }
              }
              dimPlatformService.setActive(account);
              return account;
            });
        }
      }
    });

    $stateProvider.state({
      name: 'destiny1',
      parent: 'destiny-account',
      redirectTo: 'destiny1.inventory',
      url: '/d1',
      component: 'content' // TODO: rename the component
    });
  })
  .name;
