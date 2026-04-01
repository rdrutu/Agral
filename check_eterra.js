const https = require('https');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const url = "https://geoportal.ancpi.ro/maps/rest/services/eterra3_publish/MapServer?f=json";

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log("Layers in eterra3_publish:");
      json.layers.forEach(l => console.log(`${l.id}: ${l.name}`));
    } catch (e) {
      console.error("Error parsing JSON:", e.message);
    }
  });
}).on('error', err => console.error(err));
