const https = require('https');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Test WMS capabilities or standard GetMap
const url = "https://geoportal.ancpi.ro/maps/rest/services/imobile/Imobile/MapServer/WMSServer?request=GetCapabilities&service=WMS";
// OR Export: "https://geoportal.ancpi.ro/maps/rest/services/imobile/Imobile/MapServer/export?bbox=23.5,46.7,23.6,46.8&bboxSR=4326&layers=show:1&size=256,256&format=png&transparent=true&f=image"

https.get(url, (res) => {
  console.log("WMS status:", res.statusCode);
}).on('error', err => console.error(err));

const urlExport = "https://geoportal.ancpi.ro/maps/rest/services/imobile/Imobile/MapServer/export?bbox=23.5,46.7,23.6,46.8&bboxSR=4326&layers=show:1&size=256,256&format=png&transparent=true&f=image";
https.get(urlExport, (res) => {
  console.log("Export status:", res.statusCode);
}).on('error', err => console.error(err));
