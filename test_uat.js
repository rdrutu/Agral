const https = require('https');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const url = "https://geoportal.ancpi.ro/arcgis/rest/services/administrativ/UAT_Grupate/MapServer/0/query?where=SIRUTA=40991&outFields=nume_uat,judet&f=json";

https.get(url, (res) => {
  console.log("Status:", res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(data);
  });
}).on('error', err => console.error(err));
