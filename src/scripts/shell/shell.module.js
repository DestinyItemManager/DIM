import angular from 'angular';

import UIRouterModule from '@uirouter/angularjs';

import { ActivityTrackerDirective, ActivityTrackerService } from './activity-tracker';
import contentComponent from './content/content.component';
import backLinkComponent from './shell/backLink.component';
import { RefreshStoresComponent } from './refresh-stores.component';
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
  .component('refreshStores', RefreshStoresComponent)
  .component('content', contentComponent)
  .component('backLink', backLinkComponent)
  .component('countdown', CountdownComponent)
  .component('starRating', StarRatingComponent)
  .directive('scrollClass', ScrollClass)
  .config(($stateProvider, $urlServiceProvider) => {
    'ngInject';

    // Content state is the base for "full" DIM views with a header
    $stateProvider.state({
      name: 'content',
      abstract: true,
      component: 'content'
    });

    // TODO: move this out of the module
    // A dummy state that'll redirect to the selected character's inventory
    $stateProvider.state({
      name: 'destiny1',
      parent: 'content',
      url: '/d1',
      resolve: {
        activePlatform: (dimPlatformService) => {
          'ngInject';
          // TODO: this is a mess
          const activePlatform = dimPlatformService.getActive();
          if (activePlatform) {
            return activePlatform;
          }
          return dimPlatformService.getPlatforms().then(() => dimPlatformService.getActive());
        }
      },
      controller: ($state, activePlatform) => {
        'ngInject';
        // TODO: make sure it's a D1 platform, replicate this at the top level
        console.log('controller?', activePlatform);
        if (activePlatform) {
          console.log('go to destiny1account.inventory', {
            destinyMembershipId: activePlatform.membershipId,
            platformType: activePlatform.platformType
          });
          $state.go('inventory', {
            destinyMembershipId: activePlatform.membershipId,
            platformType: activePlatform.platformType
          });
        } else {
          $state.go('login');
        }
      }
    });

    // TODO: move this, and/or replace "content" with this
    // TODO: use https://github.com/angular-ui/ui-router/wiki/Multiple-Named-Views to inject stuff into header
    $stateProvider.state({
      name: 'destiny1account',
      abstract: true,
      parent: 'content',
      url: '/d1/:destinyMembershipId-:platformType',
      // TODO: unify this into a single "account"
      resolve: {
        destinyMembershipId: ($transition$) => {
          'ngInject';
          return $transition$.params().destinyMembershipId;
        },
        platformType: ($transition$) => {
          'ngInject';
          return $transition$.params().platformType;
        }
      }
    });

    $urlServiceProvider.rules.when('/d1/', '/d1');
    $urlServiceProvider.rules.when('/d1/:destinyMembershipId-:platformType/', '/d1/:destinyMembershipId-:platformType/inventory');
    $urlServiceProvider.rules.when('/d1/:destinyMembershipId-:platformType', '/d1/:destinyMembershipId-:platformType/inventory');
  })
  .name;
