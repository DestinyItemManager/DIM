(function() {
  'use strict';

  // A directive to either set src (for images) or background-image (everything else)
  // to a path on bungie.net, or if unavailable, to a path in our extension.
  angular.module('dimApp')
    .directive('dimBungieImageFallback', ImageFallback);

  ImageFallback.$inject = ['$q'];

  function ImageFallback($q) {
    // Return an always-successful promise to either the bungie-hosted image
    // or the local (slower) extension hosted image. Memoized so once we know
    // we don't try again.
    var loadImage = _.memoize(function(path) {
      return $q(function(resolve) {
        $('<img/>').attr('src', 'http://www.bungie.net' + path)
          .load(function() {
            $(this).remove();
            resolve('http://www.bungie.net' + path);
          })
          .error(function() {
            $(this).remove();
            resolve(chrome.extension.getURL(path));
          });
      });
    });

    return {
      bind: 'A',
      link: function(scope, element, attrs) {
        var elem = element[0];

        scope.$watch(attrs.dimBungieImageFallback, function(path) {
          if (path && path.length) {
            loadImage(path).then(function(url) {
              if (elem.nodeName === 'IMG') {
                elem.src = url;
              } else {
                elem.style.backgroundImage = 'url(' + url + ')';
              }
            });
          }
        });
      }
    };
  }
})();
