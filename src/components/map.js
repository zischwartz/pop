import React from 'react';
import mapboxgl from 'mapbox-gl'
import LegendControl from './legend.js'
import {getDistance} from '../utils.js'

import styles from './map.css';

mapboxgl.accessToken = 'pk.eyJ1IjoiemlzY2h3YXJ0eiIsImEiOiJjaXhxOXp5eGIwOHJqMzNubnI2Zjh2a2RjIn0.CMKNggl2Se8uH0GEKEJcJw'
window.mapboxgl = mapboxgl
// image markers example, possibly useful
// https://www.mapbox.com/mapbox-gl-js/example/geojson-markers/

class Map extends React.Component {
  constructor(props) {
    super(props)
  }
  componentDidMount(){
    if (!mapboxgl.supported()) {
      alert('Your browser does not support Mapbox GL');
      return
    } else { console.log('supported!')}
    make_map(this.refs.mapboxMap).then(load_data).then(([geojson, map])=> {
      window.map = map //debug
      map.addSource('data', {
        type: 'geojson',
        data: geojson,
        // cluster: true, // https://www.mapbox.com/mapbox-gl-js/example/cluster/
        // clusterRadius: 25 // default is 50
      })
      console.log('done adding data')
      map.addLayer(point_layer_obj()); // end add layer
      // same as above, just need a different one for hover/click
      let hover_layer = point_layer_obj()
      hover_layer['paint']['circle-color']= 'rgba(100, 180, 200, 0.9)'
      hover_layer['id'] =  'point-hover'
      hover_layer['filter'] =  ["==", 'id', "NONE"]
      map.addLayer(hover_layer)
      console.log('done adding layers')
      // now add some controls
      map.addControl(new mapboxgl.ScaleControl({
        maxWidth: 250,
        unit: 'imperial'
      }))
      map.addControl(new LegendControl({}))
      map.addControl(new mapboxgl.NavigationControl());
      // map.addControl(new mapboxgl.GeolocateControl({  positionOptions: {   enableHighAccuracy: true }}))
      // finally setup our popups
      setup_popups(map)

    })
  }
  render() {

    return (<div ref="mapboxMap" className={styles.map}/>);
  }
}

export default Map;

function load_data(map) {
  return new Promise(function(resolve, reject){
        require.ensure([], function() {
          let counties = require("../../data/counties.json")
          var geojson = {features: [],  type: 'FeatureCollection'}
          for (let county of counties.data){
            let [lat, lng, pop, name, state] = [county[10], county[11], county[4], county[3], county[0]]
            let aland = county[6]
            let id = `${name}, ${state}`

            // let offset = Math.sqrt(aland)/4000
            let offset = 0
            let f = create_feature(lng, lat, {pop, aland, offset, name, state, id, lat, lng})

            // let f = create_feature(county[11], county[10], {pop:county[4]})
            geojson.features.push(f)
          }
          resolve([geojson, map])


      }) // end ensure
  }) // end promise, which is returned
} // end load data


function make_map(container){
  // console.log('make map called, about to promise')
  // console.log(mapboxgl.version)
  return new Promise(function(resolve, reject){
    let map = new mapboxgl.Map({
          container: container, // can be element or element id
          // style: 'mapbox://styles/mapbox/streets-v9'
          zoom: 4,
          minZoom: 3,
          maxZoom: 16,
          center:[-99, 40],
          style: 'mapbox://styles/mapbox/dark-v9', //hosted style id
      })
    map.on('load', ()=> resolve(map) )
  })
}

function create_feature(lng, lat, properties={}){
  return {
    type: 'Feature',
    properties: properties,
    geometry: {
      type: 'Point',
      coordinates: [lng, lat]
    }
  }
}

// map.on('mouseover', function(e) {
//   var features = map.queryRenderedFeatures(e.point, { layers: ['point'] });
//  // Change the cursor style as a UI indicator.
//   map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
// })

function setup_popups(map){

  var popup = new mapboxgl.Popup({closeButton: false,  closeOnClick: false })
  map.on('mousedown', function(e) {
    if (!e.point){return}
    var features = map.queryRenderedFeatures(e.point, { layers: ['point'] });
    if (!features.length) {
        popup.remove();
        return;
    }
    // XXX
    // this is a hack because queryRenderedFeatures returns too many results when data driven circle radius
    // see https://github.com/mapbox/mapbox-gl-js/issues/3604
    // not performant enough for on mousemove, had to add lat lng because of this
    features.sort( (a, b)=>{
      return getDistance(e.lngLat, {lat:a.properties.lat, lng:a.properties.lng})-getDistance(e.lngLat, {lat:b.properties.lat, lng:b.properties.lng})
    })
    var feature = features[0];
    if (feature){
      map.setFilter('point-hover', ["==", 'id', feature.properties.id])
    }
    // Populate the popup and set its coordinates
    // based on the feature found.
    let pop = feature.properties.pop
    // pop = pop > 1000000 : pop/
    popup.setLngLat(feature.geometry.coordinates)
        .setHTML(feature.properties.id+ ' <br>'+pop.toLocaleString())
        .addTo(map);
    }) // end on mousedown
}

// don't actually include min zoom in our zoom stops, as that would  cause the difference to be 0
function create_stops(zooms=[4, 6, 8, 10, 12, 14, 16], values=[0, 1e1, 1e2, 1e3, 1e4, 1e5, 1e6, 1e7], min_zoom=3){
  let stops = []
  for (let zoom of zooms){
    let zd = zoom-min_zoom // assumes we're only zoomin in
    for (let value of values){
      let rad = Math.sqrt(value/1000) //Math.log(value)
      rad*=zd
      let s = [{zoom, value}, rad]
      stops.push(s)
    }

  }
  return stops
}

// console.log( create_stops() )

function point_layer_obj(){
  return {
    id: 'point',
    type: 'circle',
    source: 'data',
    paint: {
      'circle-color': 'rgba(100, 150, 150, 0.35)',
      'circle-stroke-color': 'rgba(10, 70, 70, 0.7)',
      // 'circle-stroke-color': 'rgba(0, 150, 150, 1)',
      'circle-stroke-width': 1,
      // 'circle-color': 'red',
      // 'circle-radius': 4,
      'circle-radius': {
        property: 'pop',
        stops: create_stops()

      }
    }
  }
}


// stops: [
  // [{zoom: 4, value: 1}, 2],
  // [{zoom: 4, value: 1000}, 5],
  // [{zoom: 4, value: 10000} , 10],
  // [{zoom: 4, value: 10000000} , 80],
  // [{zoom: 6, value: 0}, 12],
  // [{zoom: 6, value: 2000}, 32]
  // [100, 2],
  // [1000, 4],
  // [10000, 8],
  // [100000, 16],
  // [1000000, 32],
  // [10000000, 64],
  // [100000, 'yellow']
// ]
