## Engine
- Multiple Animations, each one has one \[0,100\] progress
- Scroll can drags animation
    - If scroll only occurs partially in drag area, drag only counts partially
- Scroll (start?) in certrain snapps animation to 0% / 100%
- Snap to 0%/100% when scroll stops
- Snap to 0% when there is no way scrolling could reach 0%


## Animation
- render(progress) function
- drag distance (scroll px to animation progress (change) mapper)
- some way to specify which scroll drags
    - functions
        - getScrollDownDrag(y)
        - getScrollUpDrag(y)
- some way to specify which scroll (start) snaps
    - functions
        - shouldScrollDownSnap
        - shouldScrollUpSnap

- some way to specify if scroll stop should snap
    - function
        - handleScrollStop
