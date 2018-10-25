# Scroll Animation Engine

Engine to register performant animations that are driven (progress is dragged or progress change is triggered) by scroll.

Originally part of an animated header which transitioned from a big state to a small state based on user scroll.

Code is not yet as clean and well structured as I'd like to have it, but it works.

Let's see where this project goes.

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
- `yarn demo:start` starts the dev server
- `yarn demo:build` builds the demo in demo/dist
- `yarn demo:publish` publish demo to Github Pages
