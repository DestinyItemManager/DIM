(function(doc) {

  log = noop; // noOp, remove this line to enable debugging

  var coordinateSystemForElementFromPoint;

  function main(config) {
    config = config || {};

    coordinateSystemForElementFromPoint = navigator.userAgent.match(/OS [1-4](?:_\d+)+ like Mac/) ? "page" : "client";

    var div = doc.createElement('div');
    var dragDiv = 'draggable' in div;
    var evts = 'ondragstart' in div && 'ondrop' in div;

    var needsPatch = !(dragDiv || evts) || /iPad|iPhone|iPod|Android/.test(navigator.userAgent);
    log((needsPatch ? "" : "not ") + "patching html5 drag drop");

    if(!needsPatch) {
        return;
    }

    if(!config.enableEnterLeave) {
      DragDrop.prototype.synthesizeEnterLeave = noop;
    }

    if(config.holdToDrag){
      doc.addEventListener("touchstart", touchstartDelay(config.holdToDrag));
    }
    else {
      doc.addEventListener("touchstart", touchstart);
    }
  }

  function DragDrop(event, el) {

    this.dragData = {};
    this.dragDataTypes = [];
    this.dragImage = null;
    this.dragImageTransform = null;
    this.dragImageWebKitTransform = null;
    this.customDragImage = null;
    this.customDragImageX = null;
    this.customDragImageY = null;
    this.el = el || event.target;

    log("dragstart");

    if (this.dispatchDragStart()) {
      this.createDragImage();
      this.listen();
    }
  }

  DragDrop.prototype = {
    listen: function() {
      var move = onEvt(doc, "touchmove", this.move, this);
      var end = onEvt(doc, "touchend", ontouchend, this);
      var cancel = onEvt(doc, "touchcancel", cleanup, this);

      function ontouchend(event) {
        this.dragend(event, event.target);
        cleanup.call(this);
      }
      function cleanup() {
        log("cleanup");
        this.dragDataTypes = [];
        if (this.dragImage !== null) {
          this.dragImage.parentNode.removeChild(this.dragImage);
          this.dragImage = null;
          this.dragImageTransform = null;
          this.dragImageWebKitTransform = null;
        }
        this.customDragImage = null;
        this.customDragImageX = null;
        this.customDragImageY = null;
        this.el = this.dragData = null;
        return [move, end, cancel].forEach(function(handler) {
          return handler.off();
        });
      }
    },
    move: function(event) {
      event.preventDefault();
      var pageXs = [], pageYs = [];
      [].forEach.call(event.changedTouches, function(touch) {
        pageXs.push(touch.pageX);
        pageYs.push(touch.pageY);
      });

      var x = average(pageXs) - (this.customDragImageX || parseInt(this.dragImage.offsetWidth, 10) / 2);
      var y = average(pageYs) - (this.customDragImageY || parseInt(this.dragImage.offsetHeight, 10) / 2);
      this.translateDragImage(x, y);

      this.synthesizeEnterLeave(event);
    },
    // We use translate instead of top/left because of sub-pixel rendering and for the hope of better performance
    // http://www.paulirish.com/2012/why-moving-elements-with-translate-is-better-than-posabs-topleft/
    translateDragImage: function(x, y) {
      var translate = "translate(" + x + "px," + y + "px) ";

      if (this.dragImageWebKitTransform !== null) {
        this.dragImage.style["-webkit-transform"] = translate + this.dragImageWebKitTransform;
      }
      if (this.dragImageTransform !== null) {
        this.dragImage.style.transform = translate + this.dragImageTransform;
      }
    },
    synthesizeEnterLeave: function(event) {
      var target = elementFromTouchEvent(this.el,event)
      if (target != this.lastEnter) {
        if (this.lastEnter) {
          this.dispatchLeave(event);
        }
        this.lastEnter = target;
        if (this.lastEnter) {
          this.dispatchEnter(event);
        }
      }
      if (this.lastEnter) {
        this.dispatchOver(event);
      }
    },
    dragend: function(event) {

      // we'll dispatch drop if there's a target, then dragEnd.
      // drop comes first http://www.whatwg.org/specs/web-apps/current-work/multipage/dnd.html#drag-and-drop-processing-model
      log("dragend");

      if (this.lastEnter) {
        this.dispatchLeave(event);
      }

      var target = elementFromTouchEvent(this.el,event)
      if (target) {
        log("found drop target " + target.tagName);
        this.dispatchDrop(target, event);
      } else {
        log("no drop target");
      }

      var dragendEvt = doc.createEvent("Event");
      dragendEvt.initEvent("dragend", true, true);
      this.el.dispatchEvent(dragendEvt);
    },
    dispatchDrop: function(target, event) {
      var dropEvt = doc.createEvent("Event");
      dropEvt.initEvent("drop", true, true);

      var touch = event.changedTouches[0];
      var x = touch[coordinateSystemForElementFromPoint + 'X'];
      var y = touch[coordinateSystemForElementFromPoint + 'Y'];

      var targetOffset = getOffset(target);

      dropEvt.offsetX = x - targetOffset.x;
      dropEvt.offsetY = y - targetOffset.y;

      dropEvt.dataTransfer = {
        types: this.dragDataTypes,
        getData: function(type) {
          return this.dragData[type];
        }.bind(this),
        dropEffect: "move"
      };
      dropEvt.preventDefault = function() {
         // https://www.w3.org/Bugs/Public/show_bug.cgi?id=14638 - if we don't cancel it, we'll snap back
      }.bind(this);

      once(doc, "drop", function() {
        log("drop event not canceled");
      },this);

      target.dispatchEvent(dropEvt);
    },
    dispatchEnter: function(event) {

      var enterEvt = doc.createEvent("Event");
      enterEvt.initEvent("dragenter", true, true);
      enterEvt.dataTransfer = {
        types: this.dragDataTypes,
        getData: function(type) {
          return this.dragData[type];
        }.bind(this)
      };

      var touch = event.changedTouches[0];
      enterEvt.pageX = touch.pageX;
      enterEvt.pageY = touch.pageY;
      enterEvt.clientX = touch.clientX;
      enterEvt.clientY = touch.clientY;

      this.lastEnter.dispatchEvent(enterEvt);
    },
    dispatchOver: function(event) {

      var overEvt = doc.createEvent("Event");
      overEvt.initEvent("dragover", true, true);
      overEvt.dataTransfer = {
        types: this.dragDataTypes,
        getData: function(type) {
          return this.dragData[type];
        }.bind(this)
      };

      var touch = event.changedTouches[0];
      overEvt.pageX = touch.pageX;
      overEvt.pageY = touch.pageY;
      overEvt.clientX = touch.clientX;
      overEvt.clientY = touch.clientY;

      this.lastEnter.dispatchEvent(overEvt);
    },
    dispatchLeave: function(event) {

      var leaveEvt = doc.createEvent("Event");
      leaveEvt.initEvent("dragleave", true, true);
      leaveEvt.dataTransfer = {
        types: this.dragDataTypes,
        getData: function(type) {
          return this.dragData[type];
        }.bind(this)
      };

      var touch = event.changedTouches[0];
      leaveEvt.pageX = touch.pageX;
      leaveEvt.pageY = touch.pageY;
      leaveEvt.clientX = touch.clientX;
      leaveEvt.clientY = touch.clientY;

      this.lastEnter.dispatchEvent(leaveEvt);
      this.lastEnter = null;
    },
    dispatchDragStart: function() {
      var evt = doc.createEvent("Event");
      evt.initEvent("dragstart", true, true);
      evt.dataTransfer = {
        setData: function(type, val) {
          this.dragData[type] = val;
          if (this.dragDataTypes.indexOf(type) == -1) {
            this.dragDataTypes[this.dragDataTypes.length] = type;
          }
          return val;
        }.bind(this),
        setDragImage: function(el, x, y){
          this.customDragImage = el;
          this.customDragImageX = x
          this.customDragImageY = y
        }.bind(this),
        dropEffect: "move"
      };
      return this.el.dispatchEvent(evt);
    },
    createDragImage: function() {
      if (this.customDragImage) {
        this.dragImage = this.customDragImage.cloneNode(true);
        duplicateStyle(this.customDragImage, this.dragImage);
      } else {
        this.dragImage = this.el.cloneNode(true);
        duplicateStyle(this.el, this.dragImage);
      }
      this.dragImage.style.opacity = "0.5";
      this.dragImage.style.position = "absolute";
      this.dragImage.style.left = "0px";
      this.dragImage.style.top = "0px";
      this.dragImage.style.zIndex = "999999";

      var transform = this.dragImage.style.transform;
      if (typeof transform !== "undefined") {
        this.dragImageTransform = "";
        if (transform != "none") {
          this.dragImageTransform = transform.replace(/translate\(\D*\d+[^,]*,\D*\d+[^,]*\)\s*/g, '');
        }
      }

      var webkitTransform = this.dragImage.style["-webkit-transform"];
      if (typeof webkitTransform !== "undefined") {
        this.dragImageWebKitTransform = "";
        if (webkitTransform != "none") {
          this.dragImageWebKitTransform = webkitTransform.replace(/translate\(\D*\d+[^,]*,\D*\d+[^,]*\)\s*/g, '');
        }
      }

      this.translateDragImage(-9999, -9999);

      doc.body.appendChild(this.dragImage);
    }
  };

  // delayed touch start event
  function touchstartDelay(delay) {
    return function(evt){
      var el = evt.target;

      console.log('touchstartDelay', delay, el.draggable, evt);
      do {
        if (el.draggable === true) {
          var heldItem = function(e) {
            console.log('touchstart', e);
            end.off();
            cancel.off();
            scroll.off();
            touchstart(evt);
          };

          var onReleasedItem = function(e) {
            console.log('released', e);
            end.off();
            cancel.off();
            scroll.off();
            clearTimeout(timer);
          };

          var timer = setTimeout(heldItem, delay);

          var end = onEvt(el, 'touchend', onReleasedItem, this);
          var cancel = onEvt(el, 'touchcancel', onReleasedItem, this);
          var scroll = onEvt(window, 'scroll', onReleasedItem, this);
          break;
        }
      } while ((el = el.parentNode) && el !== doc.body);
    };
  };

  // event listeners
  function touchstart(evt) {
    var el = evt.target;
    do {
      if (el.draggable === true) {
        // If draggable isn't explicitly set for anchors, then simulate a click event.
        // Otherwise plain old vanilla links will stop working.
        // https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Touch_events#Handling_clicks
        if (!el.hasAttribute("draggable") && el.tagName.toLowerCase() == "a") {
          var clickEvt = document.createEvent("MouseEvents");
          clickEvt.initMouseEvent("click", true, true, el.ownerDocument.defaultView, 1,
            evt.screenX, evt.screenY, evt.clientX, evt.clientY,
            evt.ctrlKey, evt.altKey, evt.shiftKey, evt.metaKey, 0, null);
          el.dispatchEvent(clickEvt);
          log("Simulating click to anchor");
        }
        evt.preventDefault();
        new DragDrop(evt,el);
        break;
      }
    } while((el = el.parentNode) && el !== doc.body);
  }

  // DOM helpers
  function elementFromTouchEvent(el,event) {
    var touch = event.changedTouches[0];
    var target = doc.elementFromPoint(
      touch[coordinateSystemForElementFromPoint + "X"],
      touch[coordinateSystemForElementFromPoint + "Y"]
    );
    return target;
  }

  //calculate the offset position of an element (relative to the window, not the document)
  function getOffset(el) {
    var rect = el.getBoundingClientRect();
    return {
      "x": rect.left,
      "y": rect.top
    };
  }

  function onEvt(el, event, handler, context) {
    if(context) {
      handler = handler.bind(context);
    }
    el.addEventListener(event, handler);
    return {
      off: function() {
        return el.removeEventListener(event, handler);
      }
    };
  }

  function once(el, event, handler, context) {
    if(context) {
      handler = handler.bind(context);
    }
    function listener(evt) {
      handler(evt);
      return el.removeEventListener(event,listener);
    }
    return el.addEventListener(event,listener);
  }

  // duplicateStyle expects dstNode to be a clone of srcNode
  function duplicateStyle(srcNode, dstNode) {
    // Is this node an element?
    if (srcNode.nodeType == 1) {
      // Remove any potential conflict attributes
      dstNode.removeAttribute("id");
      dstNode.removeAttribute("class");
      dstNode.removeAttribute("style");
      dstNode.removeAttribute("draggable");

      // Clone the style
      var cs = window.getComputedStyle(srcNode);
      for (var i = 0; i < cs.length; i++) {
        var csName = cs[i];
        dstNode.style.setProperty(csName, cs.getPropertyValue(csName), cs.getPropertyPriority(csName));
      }

      // Pointer events as none makes the drag image transparent to document.elementFromPoint()
      dstNode.style.pointerEvents = "none";
    }

    // Do the same for the children
    if (srcNode.hasChildNodes()) {
      for (var j = 0; j < srcNode.childNodes.length; j++) {
        duplicateStyle(srcNode.childNodes[j], dstNode.childNodes[j]);
      }
    }
  }

  // general helpers
  function log(msg) {
    console.log(msg);
  }

  function average(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((function(s, v) {
      return v + s;
    }), 0) / arr.length;
  }

  function noop() {}

  main(window.iosDragDropShim);


})(document);
