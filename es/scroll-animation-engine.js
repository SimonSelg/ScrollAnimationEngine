import _defineProperty from '@babel/runtime/helpers/esm/defineProperty';
import styler from 'stylefire';
import sync from 'framesync';

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(value1, value2, amount) {
  return (1 - amount) * value1 + amount * value2;
}

function isDomElement(element) {
  return element instanceof Element || element instanceof HTMLDocument;
}

function devLog(message) {
  return;
  console.info("[scroll-animation-engine] " + message);
}

var ScrollAnimationEngine =
/*#__PURE__*/
function () {
  function ScrollAnimationEngine() {
    var _this = this;

    _defineProperty(this, "hasScrollHandler", false);

    _defineProperty(this, "animating", false);

    _defineProperty(this, "scrolling", false);

    _defineProperty(this, "onScrollStartCallbacks", []);

    _defineProperty(this, "onScrollStopCallbacks", []);

    _defineProperty(this, "lastTrackedScrollPosition", window.pageYOffset);

    _defineProperty(this, "lastTrackedScrollTimestamp", null);

    _defineProperty(this, "scrollTimeout", null);

    _defineProperty(this, "animations", new Map());

    _defineProperty(this, "animationRenderLoop", function (_ref) {
      var timestamp = _ref.timestamp;
      var lastScroll = _this.lastTrackedScrollPosition;
      var scroll = window.pageYOffset;
      var scrollDelta = scroll - lastScroll;
      var scrollDirection = Math.sign(scrollDelta);
      var nowTime = timestamp; // handle change in scroll position

      if (scrollDirection === 0) {
        // check if this means the user stopped scrolling
        var elapsed = nowTime - _this.lastTrackedScrollTimestamp;

        if (elapsed >= 250) {
          _this.setScrollingState(false);
        }
      } else {
        // set state + track values for next iteration
        _this.setScrollingState(true);

        _this.lastTrackedScrollPosition = scroll;
        _this.lastTrackedScrollTimestamp = nowTime;
      } // devLog(`processing scroll delta of ${scrollDelta}, ${scroll}, ${lastScroll}`)
      // animations itself


      var scrollAreaStart = scrollDirection === 1 ? lastScroll : scroll;
      var scrollAreaEnd = scrollDirection === 1 ? scroll : lastScroll;

      for (var _iterator = _this.animations, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        var _ref2;

        if (_isArray) {
          if (_i >= _iterator.length) break;
          _ref2 = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          _ref2 = _i.value;
        }

        var _ref3 = _ref2,
            identifier = _ref3[0],
            animation = _ref3[1];

        var dragDistance = _this.computeDragDistanceFromScrollForAnimation(scrollAreaStart, scrollAreaEnd, scrollDirection, animation);

        var drag = animation.distanceToProgress(dragDistance);
        var oldProgress = animation.progress; // devLog(`applying drag ${drag} to animation ${identifier}`)

        _this.processAnimation(animation, drag);

        if (animation.progress !== oldProgress) {
          animation.render(animation.progress, animation.domElements);

          _this.callProgressCallbacksIfNeeded(animation, scroll);
        }
      } // stop loop if animation is done


      if (_this.haveAllAnimationsStopped()) {
        _this.stopAnimationLoop(nowTime);

        return;
      }

      sync.update(_this.animationRenderLoop);
    });

    _defineProperty(this, "onScroll", function () {
      // devLog('onScroll')
      if (_this.animating) {
        return;
      }

      var scrollYPos = window.pageYOffset;
      var delta = scrollYPos - _this.lastTrackedScrollPosition;
      var direction = Math.sign(delta); // this is probably the initial scroll event

      if (direction === 0) return;

      _this.setScrollingState(true);

      var scrollAreaStart = direction === 1 ? _this.lastTrackedScrollPosition : scrollYPos;
      var scrollAreaEnd = direction === 1 ? scrollYPos : _this.lastTrackedScrollPosition;

      if (_this.isScrollToReact(scrollAreaStart, scrollAreaEnd, direction)) {
        _this.lastTrackedScrollTimestamp = Date.now();

        _this.startAnimationLoop();

        return; // the values will be processed in the animation loop instead
      }

      _this.lastTrackedScrollPosition = scrollYPos; // scroll stop detection

      if (_this.scrollTimeout) clearTimeout(_this.scrollTimeout);
      _this.scrollTimeout = setTimeout(_this.setScrollingState, 250, false);
    });

    _defineProperty(this, "setScrollingState", function (state) {
      if (_this.scrolling === state) return;
      _this.scrolling = state;

      if (_this.scrolling) {
        _this.onScrollStart();
      } else {
        _this.onScrollStop();
      }
    });
  }

  var _proto = ScrollAnimationEngine.prototype;

  _proto.init = function init() {
    this.lastTrackedScrollPosition = window.pageYOffset;
  };

  _proto.callProgressCallbacksIfNeeded = function callProgressCallbacksIfNeeded(animation, scroll) {
    if (animation.animationStartReached && animation.progress === 0) animation.animationStartReached(scroll, animation.domElements, sync.postRender);
    if (animation.animationEndReached && animation.progress === 1) animation.animationEndReached(scroll, animation.domElements, sync.postRender);
  };

  _proto.processAnimation = function processAnimation(animation, drag) {
    var newTargetProgress = clamp(animation.targetProgress + drag, 0, 1);
    this.setTargetProgress(animation, newTargetProgress);
    animation.progress = lerp(animation.progress, animation.targetProgress, animation.lerpFactor);

    if (Math.abs(animation.progress - animation.targetProgress) < 0.001) {
      animation.progress = animation.targetProgress;
      animation.animating = false;
    } else {
      animation.animating = true;
    }
  };

  _proto.setTargetProgress = function setTargetProgress(animation, value) {
    if (animation.targetProgress === value) return;
    var oldTargetProcess = animation.targetProgress;
    animation.targetProgress = value;

    if (animation.targetProgress !== oldTargetProcess) {
      this.callTargetProgressCallbacksIfNeeded(animation);
    }
  };

  _proto.callTargetProgressCallbacksIfNeeded = function callTargetProgressCallbacksIfNeeded(animation) {
    if (animation.animationTargetStartReached && animation.targetProgress === 0) animation.animationTargetStartReached(this.lastTrackedScrollPosition, animation);
    if (animation.animationTargetEndReached && animation.targetProgress === 1) animation.animationTargetEndReached(this.lastTrackedScrollPosition, animation);
  };

  _proto.haveAllAnimationsStopped = function haveAllAnimationsStopped() {
    for (var _iterator2 = this.animations, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
      var _ref4;

      if (_isArray2) {
        if (_i2 >= _iterator2.length) break;
        _ref4 = _iterator2[_i2++];
      } else {
        _i2 = _iterator2.next();
        if (_i2.done) break;
        _ref4 = _i2.value;
      }

      var _ref5 = _ref4,
          identifier = _ref5[0],
          animation = _ref5[1];

      if (animation.animating) {
        return false;
      }
    }

    return true;
  };

  _proto.startAnimationLoop = function startAnimationLoop() {
    devLog('starting animation loop'); // preparations

    if (this.scrollTimeout) clearTimeout(this.scrollTimeout); // start the loop!

    sync.update(this.animationRenderLoop);
    this.animating = true;
  };

  _proto.stopAnimationLoop = function stopAnimationLoop(nowTime) {
    devLog('stopping animation loop');

    if (this.scrolling) {
      // create timeout to catch scroll stop
      var elapsed = nowTime - this.lastTrackedScrollTimestamp;
      var remaining = 250 - elapsed; // devLog(`creating timeout to catch scroll stop, remaining are ${remaining}ms`)

      this.scrollTimeout = setTimeout(this.setScrollingState, remaining, false);
    }

    this.animating = false;
  };

  _proto.computeDragDistanceFromScrollForAreas = function computeDragDistanceFromScrollForAreas(scrollAreaStart, scrollAreaEnd, direction, areas) {
    for (var _iterator3 = areas, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
      var _ref7;

      if (_isArray3) {
        if (_i3 >= _iterator3.length) break;
        _ref7 = _iterator3[_i3++];
      } else {
        _i3 = _iterator3.next();
        if (_i3.done) break;
        _ref7 = _i3.value;
      }

      var _ref8 = _ref7;
      var start = _ref8.start,
          end = _ref8.end,
          forceDistance = _ref8.forceDistance,
          dragFactor = _ref8.dragFactor;
      // compute drag from this area => compute how much of the area the drag distance covers
      var startY = start === null ? scrollAreaStart : Math.max(scrollAreaStart, start);
      var endY = end === null ? scrollAreaEnd : Math.min(scrollAreaEnd, end);
      var countedDistance = Math.max(endY - startY, 0);

      if (countedDistance !== 0) {
        if (forceDistance) return forceDistance * direction;
        var factor = dragFactor || 1;
        return countedDistance * direction * factor;
      }
    }

    return 0;
  };

  _proto.computeDragDistanceFromScrollForAnimation = function computeDragDistanceFromScrollForAnimation(scrollAreaStart, scrollAreaEnd, direction, animation) {
    if (direction === 0) return 0;
    if (direction === 1 && animation.progress === 1) return 0;
    if (direction === -1 && animation.progress === 0) return 0;
    var areas = direction === 1 ? animation.scrollDownDragAreas() : animation.scrollUpDragAreas();
    return this.computeDragDistanceFromScrollForAreas(scrollAreaStart, scrollAreaEnd, direction, areas);
  };

  _proto.isScrollToReact = function isScrollToReact(scrollAreaStart, scrollAreaEnd, direction) {
    // algorithm WIP
    for (var _iterator4 = this.animations, _isArray4 = Array.isArray(_iterator4), _i4 = 0, _iterator4 = _isArray4 ? _iterator4 : _iterator4[Symbol.iterator]();;) {
      var _ref9;

      if (_isArray4) {
        if (_i4 >= _iterator4.length) break;
        _ref9 = _iterator4[_i4++];
      } else {
        _i4 = _iterator4.next();
        if (_i4.done) break;
        _ref9 = _i4.value;
      }

      var _ref10 = _ref9,
          idenfitifer = _ref10[0],
          animation = _ref10[1];
      // prevent drags on non-dragable animations
      var drag = this.computeDragDistanceFromScrollForAnimation(scrollAreaStart, scrollAreaEnd, direction, animation);
      if (drag !== 0) return true;
    }

    return false;
  };

  _proto.onScrollStart = function onScrollStart() {
    devLog('onScrollStart');

    for (var _iterator5 = this.onScrollStartCallbacks, _isArray5 = Array.isArray(_iterator5), _i5 = 0, _iterator5 = _isArray5 ? _iterator5 : _iterator5[Symbol.iterator]();;) {
      var _ref11;

      if (_isArray5) {
        if (_i5 >= _iterator5.length) break;
        _ref11 = _iterator5[_i5++];
      } else {
        _i5 = _iterator5.next();
        if (_i5.done) break;
        _ref11 = _i5.value;
      }

      var callback = _ref11;
      callback();
    }
  };

  _proto.onScrollStop = function onScrollStop() {
    devLog('onScrollStop');
    var start = false;
    var scroll = window.pageYOffset;

    for (var _iterator6 = this.animations, _isArray6 = Array.isArray(_iterator6), _i6 = 0, _iterator6 = _isArray6 ? _iterator6 : _iterator6[Symbol.iterator]();;) {
      var _ref12;

      if (_isArray6) {
        if (_i6 >= _iterator6.length) break;
        _ref12 = _iterator6[_i6++];
      } else {
        _i6 = _iterator6.next();
        if (_i6.done) break;
        _ref12 = _i6.value;
      }

      var _ref14 = _ref12,
          identifier = _ref14[0],
          animation = _ref14[1];

      if (animation.snapOnStop) {
        if (animation.targetProgress === 0 || animation.targetProgress === 1) continue;
        var possibleUpDistance = this.computeDragDistanceFromScrollForAnimation(0, scroll, -1, animation);
        var possibleUpDrag = animation.distanceToProgress(possibleUpDistance);
        var hasNotEnoughUpDragSpace = animation.progress + possibleUpDrag > 0;

        if (animation.progress < 0.5 || hasNotEnoughUpDragSpace) {
          devLog('snapping to 0%');
          this.setTargetProgress(animation, 0); // animation.targetProgress = 0
        } else {
          // todo: only snap if it's possible to reach 0% by scrolling up
          devLog('snapping to 100%');
          this.setTargetProgress(animation, 1); //animation.targetProgress = 1
        }

        start = true;
      }
    }

    if (start && !this.animating) {
      this.startAnimationLoop();
    }

    for (var _iterator7 = this.onScrollStopCallbacks, _isArray7 = Array.isArray(_iterator7), _i7 = 0, _iterator7 = _isArray7 ? _iterator7 : _iterator7[Symbol.iterator]();;) {
      var _ref13;

      if (_isArray7) {
        if (_i7 >= _iterator7.length) break;
        _ref13 = _iterator7[_i7++];
      } else {
        _i7 = _iterator7.next();
        if (_i7.done) break;
        _ref13 = _i7.value;
      }

      var callback = _ref13;
      callback();
    }
  };

  _proto.runAfterDomContentLoaded = function runAfterDomContentLoaded(func) {
    if (document.readyState === "complete" || document.readyState === "loaded" || document.readyState === "interactive") {
      func();
    } else {
      document.addEventListener("DOMContentLoaded", func);
    }
  };

  _proto.registerScrollHandlerIfNeeded = function registerScrollHandlerIfNeeded() {
    if (this.hasScrollHandler) return;
    window.addEventListener('scroll', this.onScroll);
    this.hasScrollHandler = true;
  };

  _proto.registerAnimation = function registerAnimation(animation) {
    var identifier = animation.identifier,
        lerpFactor = animation.lerpFactor,
        getDomElements = animation.getDomElements,
        doInitialDomSetup = animation.doInitialDomSetup,
        snapOnStop = animation.snapOnStop,
        distanceToProgress = animation.distanceToProgress,
        scrollDownDragAreas = animation.scrollDownDragAreas,
        scrollUpDragAreas = animation.scrollUpDragAreas,
        render = animation.render,
        animationTargetStartReached = animation.animationTargetStartReached,
        animationTargetEndReached = animation.animationTargetEndReached,
        animationEndReached = animation.animationEndReached,
        animationStartReached = animation.animationStartReached;
    devLog("registering animation '" + identifier + "'");
    this.registerScrollHandlerIfNeeded();
    devLog("getting dom references and initializing stylers for '" + identifier + "'"); // add styler to all the dom nodes
    // todo: store dom references not per animation, instead per engine
    // todo: extract in own function, this just sucks

    var stylifyDomObjects = function stylifyDomObjects(elements) {
      var result = {};

      var _arr = Object.keys(elements);

      for (var _i8 = 0; _i8 < _arr.length; _i8++) {
        var _identifier = _arr[_i8];
        var element = elements[_identifier];
        var res = handleElement(element);

        if (res) {
          result[_identifier] = res;
        }
      }

      return result;
    };

    var handleElement = function handleElement(element) {
      if (isDomElement(element)) {
        return {
          element: element,
          styler: styler(element)
        };
      } else if (element instanceof Array) {
        return element.map(handleElement);
      } else if (typeof element === 'object' && element !== null) {
        return stylifyDomObjects(element);
      }

      return null;
    };

    var domElements = stylifyDomObjects(getDomElements());
    /*for (const identifier of Object.keys(elements)) {
        const element = elements[identifier]
         if (isDomElement(element)) {
            domElements[identifier] = {
                element,
                styler: styler(element)
            }
        } else if (element instanceof Array) {
            domElements[identifier] = []
             for (const list_element of element) {
                domElements[identifier].push({
                    element: list_element,
                    styler: styler(list_element)
                })
            }
        }
    }*/

    if (doInitialDomSetup) doInitialDomSetup(domElements);
    this.animations.set(identifier, {
      progress: 0,
      targetProgress: 0,
      animating: false,
      lerpFactor: lerpFactor || 0.3,
      snapOnStop: snapOnStop,
      distanceToProgress: distanceToProgress,
      scrollDownDragAreas: scrollDownDragAreas,
      scrollUpDragAreas: scrollUpDragAreas,
      domElements: domElements,
      animationTargetStartReached: animationTargetStartReached,
      animationTargetEndReached: animationTargetEndReached,
      animationStartReached: animationStartReached,
      animationEndReached: animationEndReached,
      render: render
    });
    this.handleInitialScrollPosition(this.animations.get(identifier));
  };

  _proto.registerOnScrollStartCallback = function registerOnScrollStartCallback(callback) {
    this.onScrollStartCallbacks.push(callback);
    this.registerScrollHandlerIfNeeded();
  };

  _proto.registerOnScrollStopCallback = function registerOnScrollStopCallback(callback) {
    this.onScrollStopCallbacks.push(callback);
    this.registerScrollHandlerIfNeeded();
  };

  _proto.handleInitialScrollPosition = function handleInitialScrollPosition(animation) {
    var scroll = window.pageYOffset;
    if (scroll === 0) return;
    var dragDistance = this.computeDragDistanceFromScrollForAnimation(0, scroll, 1, animation);
    var drag = animation.distanceToProgress(dragDistance);
    var clampedProgress = clamp(drag, 0, 1);
    var progress = animation.snapOnStop ? Math.round(clampedProgress) : clampedProgress;
    if (progress === 0) return;
    devLog("handling intitial scroll position of " + scroll);
    animation.progress = animation.targetProgress = progress;
    this.callTargetProgressCallbacksIfNeeded(animation);
    this.callProgressCallbacksIfNeeded(animation, scroll);
    animation.render(animation.progress, animation.domElements);
  };

  return ScrollAnimationEngine;
}();

export default ScrollAnimationEngine;
