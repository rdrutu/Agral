const https = require('https');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Test WMS capabilities or standard GetMap
const wms3844 = "https://geoportal.ancpi.ro/maps/rest/services/Imobile/Imobile_3844/MapServer/WMSServer?request=GetCapabilities&service=WMS";
https.get(wms3844, (res) => {
  console.log("WMS 3844 status:", res.statusCode);
}).on('error', err => console.error(err));

const exportUrl = "https://geoportal.ancpi.ro/maps/rest/services/Imobile/Imobile_3844/MapServer/export?bbox=23.5,46.7,23.6,46.8&bboxSR=4326&layers=show:1&size=256,256&format=png&transparent=true&f=image";
https.get(exportUrl, (res) => {
  console.log("Export 3844 status:", res.statusCode);
}).on('error', err => console.error(err));

const tileUrl = "https://geoportal.ancpi.ro/maps/rest/services/Imobile/Imobile_3844/MapServer/tile/14/5638/9248";
https.get(tileUrl, (res) => {
    console.log("Tile 3844 status:", res.statusCode);
}).on('error', err => console.error(err));
