import {getDistance} from '../utils.js'

class LegendControl {
    constructor(options) {
        this.options = options
    }
    onAdd(map) {
        this._map = map;
        // window.map = map // debug
        this._container = document.createElement('div');
        this._container.className = 'mapboxgl-ctrl';
        this._container.textContent = 'Hello, world!';
        this._map.on('move', e=> this._onMove(e) );
        this._onMove() // initial
        return this._container;
    }
    _onMove(e){
      // console.log('map move', e)
      // console.log(e)
      // console.log(this._map)
      updateLegend(this._map, this._container, this.options);

    }
    getDefaultPosition() {
        return 'bottom-right';
    }
    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map.off('move', this._onMove);
        this._map = undefined;
    }
}


export default LegendControl

function updateLegend(map, container, options) {
  // const maxWidth = options && options.maxWidth || 100;
  // let initial_zoom=4 // gah, XXX don't hardwire this. it should be max zoom for whole thing.
  let value = 1e5
  // let zoom = map.getZoom()
  // let zd = 1+zoom-initial_zoom // assumes we're only zoomin in
  let zd = map.getZoom()-map.getMinZoom()
  zd = Math.max(zd, 1) // make sure it's at least 1
  let rad = Math.sqrt(value/1000) //Math.log(value)
  rad*=zd
  let width = rad*2
  setLegendScale(container, width, value)
}

function setLegendScale(container, width, value) {
    // let distance = getRoundNum(maxDistance);
    // const ratio = distance / maxDistance;
    container.style.borderRadius = '50%'
    container.style.backgroundColor = 'rgba(100, 150, 150, 0.35)'
    container.style.width = `${width}px`;
    container.style.height = `${width}px`;
    container.innerHTML = value.toLocaleString()
}


// 'circle-color': 'rgba(100, 150, 150, 0.35)',
// 'circle-stroke-color': 'rgba(10, 70, 70, 0.7)',
