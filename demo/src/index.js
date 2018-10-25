import ScrollAnimationEngine from '../../'
import './styles.css'

const engine = new ScrollAnimationEngine()

let headerYTrans = 0
let headerEndY = null

// animation
const targetHeight = 85
const logoTargetScale = 0.8

// element sizes
let headerHeight = null
let logoHeight = null
let logoWidth = null
let lineTwoHeight = null
let lineTwoRightPadding = null

const headerAnimation = {
    identifier: 'headerAnimation',
    snapOnStop: true,

    getDomElements() {
        const header = document.getElementsByTagName("header")[0]
        const logoContainer = header.getElementsByClassName("logo-container")[0]
        const lineTwo = header.getElementsByClassName("header-line-two")[0]
        const span = lineTwo.getElementsByTagName('span')[0]
        return { header, logoContainer, lineTwo, span }
    },

    doInitialDomSetup(domElements) {
        const { header, logoContainer, lineTwo } = domElements
        headerHeight = header.element.getBoundingClientRect().height

        const logoA = logoContainer.element.getElementsByTagName('a')[0]
        const logoRect = logoA.getBoundingClientRect()
        logoHeight = logoRect.height
        logoWidth = logoRect.width

        lineTwoHeight = lineTwo.element.getBoundingClientRect().height
        lineTwoRightPadding = parseInt(lineTwo.styler.get("paddingRight"))

        header.element.classList.add('fixed')
    },

    distanceToProgress(distance) {
        return distance / ((headerHeight - targetHeight) * 4)
    },

    scrollDownDragAreas() {
        return [{
            start: 50,
            end: null
        }]
    },

    scrollUpDragAreas() {
        return [{
            start: null,
            end: 450
        }]
    },

    animationTargetEndReached(scroll) {
        console.log('animationTargetEndReached', scroll)
        headerEndY = scroll
    },

    animationEndReached(scroll, domElements) {
        console.log('animationEndReached')
        domElements.lineTwo.styler.set({
            paddingRight: `${lineTwoRightPadding + logoWidth * logoTargetScale + 10}px`
        })
    },

    animationStartReached(scroll, domElements) {
        domElements.lineTwo.styler.set({
            paddingRight: `${lineTwoRightPadding}px`
        })
    },

    render(progress, domElements) {
        const headerHeightDelta = targetHeight - headerHeight
        headerYTrans = headerHeightDelta * progress

        domElements.header.styler.set({translateY: headerYTrans})
        domElements.logoContainer.styler.set({
            translateY: -headerYTrans + (targetHeight - logoHeight * logoTargetScale) * progress / 2,
            scale: 1 - (1 - logoTargetScale) * progress
        })

        domElements.lineTwo.styler.set({
            translateX: (logoWidth * logoTargetScale + 10) * progress,
            translateY: -(targetHeight - lineTwoHeight) * progress / 2,
        })
    }
}

const headerHideAnimation = {
    identifier: 'headerHideAnimation',
    snapOnStop: true,
    lerpFactor: 0.2,

    getDomElements() {
        const header = document.getElementsByTagName("header")[0]
        const span = header.getElementsByTagName('span')[0]
        return { header, span }
    },

    distanceToProgress(distance) {
        return distance /  (targetHeight * 2)
    },

    scrollDownDragAreas() {
        if (!headerEndY) return []
        const headerEndYStartPos = headerEndY + 250
        return [{
            start: headerEndYStartPos,
            end: null
        }]
    },

    scrollUpDragAreas() {
        return [{
            start: null,
            end: null,
            // forceDistance: targetHeight,
            dragFactor: 1.5
        }]
    },

    render(percentage, domElements) {
        domElements.header.styler.set({translateY: -targetHeight * percentage + headerYTrans})
    }
}

function runAfterDomContentLoaded(func) {
    if (document.readyState === "complete"
        || document.readyState === "loaded"
        || document.readyState === "interactive") {
        func()
    } else {
        document.addEventListener("DOMContentLoaded", func)
    }
}

function init() {
    console.log('init')
    engine.init()
    console.log('window.pageYOffset', window.pageYOffset)
    console.log('dom content loaded',  Math.max(window.pageYOffset, document.documentElement.scrollTop, document.body.scrollTop))
    engine.registerAnimation(headerAnimation)
    engine.registerAnimation(headerHideAnimation)
}

//runAfterDomContentLoaded(() => setTimeout(init, 15))


window.addEventListener('load', init);

