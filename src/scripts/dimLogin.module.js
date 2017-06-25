import angular from 'angular';
import { OAuthService } from './oauth/oauth.service';
import { OAuthTokenService } from './oauth/oauth-token.service';

angular.module('dimLogin', [])
  .service('OAuthTokenService', OAuthTokenService)
  .service('OAuthService', OAuthService);
