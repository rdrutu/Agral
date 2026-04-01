const https = require('https');
const fs = require('fs');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function testClick() {
  const lng = 23.5897;
  const lat = 46.7712;
  const url = `https://geoportal.ancpi.ro/maps/rest/services/imobile/Imobile/MapServer/1/query?f=json&geometry=${lng},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=true&outSR=4326`;
  
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      fs.writeFileSync('out.json', JSON.stringify(JSON.parse(data), null, 2));
      console.log('Saved to out.json');
    });
  }).on('error', err => console.error(err));
}

testClick();
