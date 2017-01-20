# US County Population Bubble Map

## About
This is basically a reworking of [Mike Bostock's](https://bost.ocks.org/mike/) [bubble map](https://bost.ocks.org/mike/bubble-map/) [example](https://bl.ocks.org/mbostock/9943478) using [mapbox-gl-js](https://github.com/mapbox/mapbox-gl-js) instead of D3.

## Mapbox-gl-js Impressions & Notes
`mapbox-gl-js` uses the WebGL so it's crazy fast. It also makes it relatively simple to do things like scale the displayed data by both the current zoom level and the sqrt of it's magnitude.

### Clicks
Less simple was allowing the user to click on circles to display the county name and population. `queryRenderedFeatures` is meant for this, but as [this issue](https://github.com/mapbox/mapbox-gl-js/issues/3604) notes, it's broken for "data-driven circles" and other similar cases.

To fix this, I wrote a quick kludge that computes the distances of all the features returned by `queryRenderedFeatures` to the click, and picks the closest one.

### Legend
The built in scale component is great, smoothly providing context as you zoom. I wanted the same thing, but for the data.


## Code
I was working on a larger project and extracted this. Because I'm lazy, I left the project structure, build system, and react/jsx rendering as they were, though they are largely unnecessary here.

To get started, install the dependencies and start the dev server

```bash
npm install
npm start

``
