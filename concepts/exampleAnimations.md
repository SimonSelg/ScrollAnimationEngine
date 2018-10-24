## Header big/short
- drag distance: SHRINK_DISTANCE
scrollPos >= SHRINK_START_OFFSET`
- scroll up drags when
`scrollPos <= (SHRINK_START_OFFSET + SHRINK_DISTANCE)`
- snap when scrolling stops

## header hide
- scroll down drags when
`scrollPos >= shrinkEnd + HIDE_START_DISTANCE`
- scroll up trigers `set animation to 0%`