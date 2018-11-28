import styler from 'stylefire'

import sync from 'framesync'

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
    if (__PRODUCTION__) return
    console.info(`[scroll-animation-engine] ${message}`)
}

class ScrollAnimationEngine {
    hasScrollHandler = false
    animating = false
    scrolling = false
    onScrollStartCallbacks = []
    onScrollStopCallbacks = []
    lastTrackedScrollPosition = window.pageYOffset
    lastTrackedScrollTimestamp = null
    scrollTimeout = null
    animations = new Map()

    init () {
        this.lastTrackedScrollPosition = window.pageYOffset
    }

    animationRenderLoop = ({timestamp}) => {
        const lastScroll = this.lastTrackedScrollPosition
        const scroll = window.pageYOffset
        const scrollDelta = scroll - lastScroll
        const scrollDirection = Math.sign(scrollDelta)
        const nowTime = timestamp

        // handle change in scroll position
        if (scrollDirection === 0) {
            // check if this means the user stopped scrolling
            const elapsed = nowTime - this.lastTrackedScrollTimestamp
            if (elapsed >= 250) {
                this.setScrollingState(false)
            }
        } else {
            // set state + track values for next iteration
            this.setScrollingState(true)
            this.lastTrackedScrollPosition = scroll
            this.lastTrackedScrollTimestamp = nowTime
        }

        // devLog(`processing scroll delta of ${scrollDelta}, ${scroll}, ${lastScroll}`)

        // animations itself
        let scrollAreaStart = scrollDirection === 1 ? lastScroll : scroll
        let scrollAreaEnd = scrollDirection === 1 ? scroll : lastScroll

        for (const [identifier, animation] of this.animations) {
            const dragDistance = this.computeDragDistanceFromScrollForAnimation(scrollAreaStart, scrollAreaEnd, scrollDirection, animation)
            const drag = animation.distanceToProgress(dragDistance)
            const oldProgress = animation.progress
            // devLog(`applying drag ${drag} to animation ${identifier}`)
            this.processAnimation(animation, drag)
            if (animation.progress !== oldProgress) {
                animation.render(animation.progress, animation.domElements)
                this.callProgressCallbacksIfNeeded(animation, scroll)
            }
        }

        // stop loop if animation is done
        if (this.haveAllAnimationsStopped()) {
            this.stopAnimationLoop(nowTime)
            return
        }

        sync.update(this.animationRenderLoop)
    }

    callProgressCallbacksIfNeeded(animation, scroll) {
        if (animation.animationStartReached && animation.progress === 0) animation.animationStartReached(scroll, animation.domElements, sync.postRender)
        if (animation.animationEndReached && animation.progress === 1) animation.animationEndReached(scroll, animation.domElements, sync.postRender)
    }

    processAnimation(animation, drag) {
        const newTargetProgress = clamp(animation.targetProgress + drag, 0, 1)
        this.setTargetProgress(animation, newTargetProgress)

        animation.progress = lerp(animation.progress, animation.targetProgress, animation.lerpFactor)
        if (Math.abs(animation.progress - animation.targetProgress) < 0.001) {
            animation.progress = animation.targetProgress
            animation.animating = false
        } else {
            animation.animating = true
        }
    }

    setTargetProgress(animation, value) {
        if (animation.targetProgress === value) return
        const oldTargetProcess = animation.targetProgress
        animation.targetProgress = value

        if (animation.targetProgress !== oldTargetProcess) {
            this.callTargetProgressCallbacksIfNeeded(animation)
        }
    }

    callTargetProgressCallbacksIfNeeded(animation) {
        if (animation.animationTargetStartReached && animation.targetProgress === 0) animation.animationTargetStartReached(this.lastTrackedScrollPosition, animation)
        if (animation.animationTargetEndReached && animation.targetProgress === 1) animation.animationTargetEndReached(this.lastTrackedScrollPosition, animation)
    }

    haveAllAnimationsStopped() {
        for (const [identifier, animation] of this.animations) {
            if (animation.animating) {
                return false
            }
        }
        return true
    }

    startAnimationLoop() {
        devLog('starting animation loop')
        // preparations
        if (this.scrollTimeout) clearTimeout(this.scrollTimeout)

        // start the loop!
        sync.update(this.animationRenderLoop)
        this.animating = true
    }

    stopAnimationLoop(nowTime) {
        devLog('stopping animation loop')
        if (this.scrolling) {
            // create timeout to catch scroll stop
            const elapsed = nowTime - this.lastTrackedScrollTimestamp
            const remaining = 250 - elapsed
            // devLog(`creating timeout to catch scroll stop, remaining are ${remaining}ms`)
            this.scrollTimeout = setTimeout(this.setScrollingState, remaining, false)
        }
        this.animating = false
    }

    computeDragDistanceFromScrollForAreas(scrollAreaStart, scrollAreaEnd, direction, areas) {
        for (const {start, end, forceDistance, dragFactor} of areas) {
            // compute drag from this area => compute how much of the area the drag distance covers
            const startY = (start === null) ? scrollAreaStart : Math.max(scrollAreaStart, start)
            const endY = (end === null) ? scrollAreaEnd : Math.min(scrollAreaEnd, end)

            const countedDistance = Math.max(endY - startY, 0)
            if (countedDistance !== 0) {
                if (forceDistance) return forceDistance * direction
                const factor = dragFactor || 1
                return countedDistance * direction * factor
            }
        }
        return 0
    }

    computeDragDistanceFromScrollForAnimation(scrollAreaStart, scrollAreaEnd, direction, animation) {
        if (direction === 0) return 0
        if (direction === 1 && animation.progress === 1) return 0
        if (direction === -1 && animation.progress === 0) return 0

        const areas = direction === 1 ? animation.scrollDownDragAreas() : animation.scrollUpDragAreas()
        return this.computeDragDistanceFromScrollForAreas(scrollAreaStart, scrollAreaEnd, direction, areas)
    }

    isScrollToReact(scrollAreaStart, scrollAreaEnd, direction) {
        // algorithm WIP
        for (const [idenfitifer, animation] of this.animations) {
            // prevent drags on non-dragable animations
            const drag = this.computeDragDistanceFromScrollForAnimation(scrollAreaStart, scrollAreaEnd, direction, animation)
            if (drag !== 0) return true
        }

        return false
    }

    onScroll = () => {
        // devLog('onScroll')

        if (this.animating) {
            return
        }

        const scrollYPos = window.pageYOffset
        const delta = scrollYPos - this.lastTrackedScrollPosition
        const direction = Math.sign(delta)

        // this is probably the initial scroll event
        if (direction === 0) return

        this.setScrollingState(true)

        let scrollAreaStart = direction === 1 ? this.lastTrackedScrollPosition : scrollYPos
        let scrollAreaEnd = direction === 1 ? scrollYPos : this.lastTrackedScrollPosition
        if (this.isScrollToReact(scrollAreaStart, scrollAreaEnd, direction)) {
            this.lastTrackedScrollTimestamp = Date.now();
            this.startAnimationLoop()
            return // the values will be processed in the animation loop instead
        }

        this.lastTrackedScrollPosition = scrollYPos

        // scroll stop detection
        if (this.scrollTimeout) clearTimeout(this.scrollTimeout)
        this.scrollTimeout = setTimeout(this.setScrollingState, 250, false)
    }

    onScrollStart() {
        devLog('onScrollStart')
        for (const callback of this.onScrollStartCallbacks) {
            callback()
        }
    }


    onScrollStop() {
        devLog('onScrollStop')
        let start = false
        const scroll = window.pageYOffset

        for (const [identifier, animation] of this.animations) {
           if (animation.snapOnStop) {
                if (animation.targetProgress === 0 || animation.targetProgress === 1) continue

                const possibleUpDistance = this.computeDragDistanceFromScrollForAnimation(0, scroll, -1, animation)
                const possibleUpDrag = animation.distanceToProgress(possibleUpDistance)
                const hasNotEnoughUpDragSpace = (animation.progress + possibleUpDrag) > 0

                if (animation.progress < 0.5 || hasNotEnoughUpDragSpace) {
                    devLog('snapping to 0%')
                    this.setTargetProgress(animation, 0)
                    // animation.targetProgress = 0
                } else {
                    // todo: only snap if it's possible to reach 0% by scrolling up
                    devLog('snapping to 100%')
                    this.setTargetProgress(animation, 1)
                    //animation.targetProgress = 1
                }
                start = true
           }
        }
        if (start && !this.animating) {
            this.startAnimationLoop()
        }
        for (const callback of this.onScrollStopCallbacks) {
            callback()
        }
    }

    setScrollingState = (state) => {
        if (this.scrolling === state) return
        this.scrolling = state
        if (this.scrolling) {
            this.onScrollStart()
        } else {
            this.onScrollStop()
        }
    }

    runAfterDomContentLoaded(func) {
        if (document.readyState === "complete"
            || document.readyState === "loaded"
            || document.readyState === "interactive") {
           func()
        } else {
            document.addEventListener("DOMContentLoaded", func)
        }
    }

    registerScrollHandlerIfNeeded() {
        if (this.hasScrollHandler) return
        window.addEventListener('scroll', this.onScroll)
        this.hasScrollHandler = true
    }

    registerAnimation(animation) {
        const {identifier, lerpFactor, getDomElements, doInitialDomSetup, snapOnStop, distanceToProgress, scrollDownDragAreas, scrollUpDragAreas, render, animationTargetStartReached, animationTargetEndReached, animationEndReached, animationStartReached} = animation
        devLog(`registering animation '${identifier}'`)
        this.registerScrollHandlerIfNeeded()

        devLog(`getting dom references and initializing stylers for '${identifier}'`)

        // add styler to all the dom nodes
        // todo: store dom references not per animation, instead per engine
        // todo: extract in own function, this just sucks

        const stylifyDomObjects = (elements) => {
            const result = {}
            for (const identifier of Object.keys(elements)) {
                const element = elements[identifier]
                const res = handleElement(element)
                if (res) {
                    result[identifier] = res
                }
            }
            return result
        }

        const handleElement = (element) =>  {
            if (isDomElement(element)) {
                return {
                    element,
                    styler: styler(element, {
                        preparseOutput: false
                    })
                }
            } else if (element instanceof Array) {
                return element.map(handleElement)
            } else if (typeof element === 'object' && element !== null) {
                return stylifyDomObjects(element)
            }
            return null
        }

        const domElements = stylifyDomObjects(getDomElements())

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

        if (doInitialDomSetup) doInitialDomSetup(domElements)

        this.animations.set(identifier, {
            progress: 0,
            targetProgress: 0,
            animating: false,
            lerpFactor: lerpFactor || 0.3,
            snapOnStop,
            distanceToProgress,
            scrollDownDragAreas,
            scrollUpDragAreas,
            domElements,
            animationTargetStartReached,
            animationTargetEndReached,
            animationStartReached,
            animationEndReached,
            render
        })


        this.handleInitialScrollPosition(this.animations.get(identifier))
    }

    registerOnScrollStartCallback(callback) {
        this.onScrollStartCallbacks.push(callback)
        this.registerScrollHandlerIfNeeded()
    }

    registerOnScrollStopCallback(callback) {
        this.onScrollStopCallbacks.push(callback)
        this.registerScrollHandlerIfNeeded()
    }

    handleInitialScrollPosition(animation) {
        const scroll = window.pageYOffset
        if (scroll === 0) return
        const dragDistance = this.computeDragDistanceFromScrollForAnimation(0, scroll, 1, animation)
        const drag = animation.distanceToProgress(dragDistance)
        const clampedProgress = clamp(drag, 0, 1)
        const progress = animation.snapOnStop ? Math.round(clampedProgress) : clampedProgress
        if (progress === 0) return

        devLog(`handling intitial scroll position of ${scroll}`)
        animation.progress = animation.targetProgress = progress
        this.callTargetProgressCallbacksIfNeeded(animation)
        this.callProgressCallbacksIfNeeded(animation, scroll)

        animation.render(animation.progress, animation.domElements)
    }
}

export default ScrollAnimationEngine
