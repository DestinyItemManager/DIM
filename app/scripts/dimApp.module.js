(function() {
  'use strict';

  angular.module('dimApp', [
    'ui.router',
    'ngAnimate',
    'ngDialog',
    'ngMessages',
    'ang-drag-drop',
    'chromeStorage',
    'angularUUID2',
    'toaster',
    'ajoslin.promise-tracker'
  ]);
})();


(function() {
    SpriteSpinner = function(el, options){
        var self = this,
            img = el.children[0];
        this.interval = options.interval || 10;
        this.diameter = options.diameter || img.width;
        this.count = 0;
        this.el = el;
        img.setAttribute("style", "position:absolute");
        el.style.width = this.diameter+"px";
        el.style.height = this.diameter+"px";
        return this;
    };
    SpriteSpinner.prototype.start = function(){
        var self = this,
            count = 0,
            img = this.el.children[0];
        this.el.display = "block";
        self.loop = setInterval(function(){
            if(count == 19){
                count = 0;
            }
            img.style.top = (-self.diameter*count)+"px";
            count++;
        }, this.interval);
    };
    SpriteSpinner.prototype.stop = function(){
        clearInterval(this.loop);
        this.el.style.display = "none";
    };
    document.SpriteSpinner = SpriteSpinner;
})();

$(document).ready(function(){
    $(".sprite-spinner").each(function(i){
      var s = new SpriteSpinner(this, {
        interval:50
      });
      s.start();
    });
});
