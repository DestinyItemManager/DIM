import angular from 'angular';
import 'angular-uuid2/dist/angular-uuid2.js';
import { OAuthService } from './oauth/oauth.service';
import { OAuthTokenService } from './oauth/oauth-token.service';

angular.module('dimLogin', ['angularUUID2'])
  .service('OAuthTokenService', OAuthTokenService)
  .service('OAuthService', OAuthService);
