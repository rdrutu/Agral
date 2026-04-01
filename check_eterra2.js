const https = require('https');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const url = "https://geoportal.ancpi.ro/maps/rest/services/eterra3_publish/MapServer?f=json";

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(data);
  });
}).on('error', err => console.error(err));
