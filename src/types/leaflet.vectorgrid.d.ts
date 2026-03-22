// Ambient module declaration for leaflet.vectorgrid
declare module 'leaflet.vectorgrid';

// Extend Leaflet namespace globally
import * as L from 'leaflet';
declare module 'leaflet' {
  namespace vectorGrid {
    function protobuf(url: string, options?: any): any;
  }
}
