// from
// https://www.mapbox.com/bites/00269/google-sheets/site.js

/* global mapboxgl */
'use strict';
mapboxgl.accessToken = 'pk.eyJ1IjoidHJpc3RlbiIsImEiOiJiUzBYOEJzIn0.VyXs9qNWgTfABLzSI3YcrQ';

var url = 'https://spreadsheets.google.com/feeds/list/16fTFtrVyW6zunP0fow5jZaupEkKA-MSMvtQQLp3-tQY/od6/public/basic?alt=json';
var bounds = [
  [-123.33469528198162, 49.18924705662877], // sw
  [-122.88734573364435, 49.31328716061665] // ne
];

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v9',
  center: [-123.1156, 49.2532],
  maxBounds: bounds,
  minZoom: 10,
  zoom: 11
});

map.addControl(new mapboxgl.Navigation({
  position: 'top-left'
}));

if (window.location.search.indexOf('embed') !== -1) map.scrollZoom.disable();

var popup = new mapboxgl.Popup({
  closeButton: false
});

map.on('load', function() {

  mapboxgl.util.getJSON(url, function(err, data) {
    document.body.classList.remove('loading');
    if (err) return console.warn(err);

    // From the requested source we'll need to do a bit of
    // data processing to get it into a format for our needs.
    // The finished output looks like GeoJSON
    var geojson = {
      type: 'FeatureCollection',
      features: []
    };

    data.feed.entry.forEach(function(d) {
      var fields = d.content.$t.split(', ');
      var lng = parseFloat(fields[2].split(': ')[1]);
      var lat = parseFloat(fields[1].split(': ')[1]);
      var address = fields[0].split(': ')[1];
      var plots = parseInt(fields[3].split(': ')[1], 10);

      geojson.features.push({
        type: 'Feature',
        properties: {
          name: d.title.$t,
          address: address,
          plots: plots
        },
        geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        }
      });
    });

    // Add reponse data as a new source on the map
    map.addSource('data', {
      type: 'geojson',
      data: geojson
    });

    map.addLayer({
      id: 'point-casing',
      type: 'circle',
      source: 'data',
      paint: {
        'circle-color': '#fff',
        'circle-radius': {
          property: 'plots',
          stops: [
            [{zoom: 8, value: 0}, 7],
            [{zoom: 8, value: 200}, 22],
            [{zoom: 16, value: 0}, 12],
            [{zoom: 16, value: 200}, 32]
          ]
        }
      }
    }, 'waterway-label');

    map.addLayer({
      id: 'point',
      type: 'circle',
      source: 'data',
      paint: {
        'circle-radius': {
          property: 'plots',
          stops: [
            [{zoom: 8, value: 0}, 5],
            [{zoom: 8, value: 200}, 20],
            [{zoom: 16, value: 0}, 10],
            [{zoom: 16, value: 200}, 30]
          ]
        },
        'circle-color': {
          property: 'plots',
          stops: [
            [0, '#B2F277'],
            [200, '#10525A']
          ]
        }
      }
    }, 'waterway-label');

    // Point popup to display Graffiti count
    map.on('mousemove', function(e) {
      var features = map.queryRenderedFeatures(e.point, {
        layers: ['point']
      });

      map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';

      if (!features.length) {
          popup.remove();
          return;
      }

      var feature = features[0];

      var contents = document.createElement('div');

      var title = document.createElement('strong');
      title.textContent = feature.properties.name;
      var address = document.createElement('span');
      address.className = 'quiet block';
      address.textContent = feature.properties.address;

      var plots = document.createElement('span');
      plots.className = 'block';
      plots.textContent = feature.properties.plots + ' plots';

      contents.appendChild(title);
      contents.appendChild(address);
      contents.appendChild(plots);

      popup.setLngLat(feature.geometry.coordinates)
        .setHTML(contents.innerHTML)
        .addTo(map);
    });

    // Append City of Vancouver data source
    var bottomContainer = document.querySelector('.mapboxgl-ctrl-bottom-right');
    var attribution = document.createElement('div');
    attribution.className = 'mapboxgl-ctrl-attrib mapboxgl-ctrl';
    var dataAttrib = document.createElement('a');
    dataAttrib.target = '_blank';
    dataAttrib.textContent = 'Community gardens and food trees: data.vancouver.ca';
    dataAttrib.href = 'http://data.vancouver.ca/datacatalogue/communityGardens.htm';
    attribution.appendChild(dataAttrib);
    bottomContainer.appendChild(attribution);
  });
});
