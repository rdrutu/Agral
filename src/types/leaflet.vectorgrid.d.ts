declare module 'leaflet.vectorgrid' {
  import * as L from 'leaflet';

  namespace VectorGrid {
    interface ProtobufOptions extends L.LayerOptions {
      vectorTileLayerStyles?: {
        [key: string]: any;
      };
      minZoom?: number;
      maxZoom?: number;
      attribution?: string;
    }

    function protobuf(url: string, options?: ProtobufOptions): L.Layer;
  }

  export default VectorGrid;
}

// Extindem tipul Leaflet global L pentru a include vectorGrid
declare module 'leaflet' {
  export const vectorGrid: {
    protobuf: (url: string, options?: any) => any;
  };
}
