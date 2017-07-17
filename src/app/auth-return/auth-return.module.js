import angular from 'angular';
import { OAuthService } from '../oauth/oauth.service';
import { OAuthTokenService } from '../oauth/oauth-token.service';
import { ReturnComponent } from './return.component';

/**
 * Unlike all other modules, this one is not included in the main
 * app - it's included directly by authReturn.js (return.html).
 *
 * As it is its own self-contained AngularJS app, it needs to
 * re-declare the OAuth bits.
 */
angular.module('authReturnModule', [])
  .service('OAuthTokenService', OAuthTokenService)
  .service('OAuthService', OAuthService)
  .component('dimReturn', ReturnComponent);
