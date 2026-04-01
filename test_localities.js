const https = require('https');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Neamt = 29. In UAT_Grupate, judet field might be "NEAMT"
const url = "https://geoportal.ancpi.ro/arcgis/rest/services/administrativ/UAT_Grupate/MapServer/0/query?where=judet=%27NEAMT%27&outFields=nume_uat,SIRUTA&f=json&resultRecordCount=10";

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(data);
  });
}).on('error', err => console.error(err));
