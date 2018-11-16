# Scroll Animation Engine

Engine to register animations that are driven by scroll. That means that animation progress is dragged or progress change is triggered by scroll.

Originally part of an animated header which transitioned from a big state to a small state based on user scroll.

Code is not yet as clean and well structured as I'd like to have it, but it works.

Let's see where this project goes.

## Requirements

Supports all major browsers, including IE11 and iOS Safari 8+

This project (and it's dependencies, especially popmotion) make use of some ES6 functionality that needs to be polyfilled in older Browsers:
- Map
- WeakSet
- WeakMap
- Math.sign
- Symbol.iterator
- Array.prototype.@@iterator


You can polyfill it using polyfill.io:
```html
<script src="https://cdn.polyfill.io/v2/polyfill.js?features=default,WeakSet,WeakMap,Math.sign,Symbol.iterator,Array.prototype.@@iterator"></script>
```

## Todo:

- Debug Log statements are still included in production bundle, DCE not working good enough to catch them
- I think we can use an array instead of an set for the animations
- cleanup code
- maybe a class is the wrong idea, since multiple instances don't really make sense
- store dom references globally in the engine, not per animation
    - currently, two animations can have the same dom references => duplicated objects

## Demo

The engine includes a demo animation (the animation the engine was developed for) in `demo` folder. 

Online demo: https://simonselg.github.io/ScrollAnimationEngine/

## Development

### Setup

```bash
# clone repo
git clone git@github.com:SimonSelg/ScrollAnimationEngine.git && cd ScrollAnimationEngine
# setup demo/dist subtree for gh-pages
git worktree add demo/dist gh-pages
```


### Yarn/npm scripts
- `yarn build` builds the library
- `yarn clean` clean build artifacts
- `yarn demo:start` starts the dev server
- `yarn demo:build` builds the demo in demo/dist
- `yarn demo:publish` publish demo to Github Pages
