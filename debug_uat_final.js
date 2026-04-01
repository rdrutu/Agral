const https = require('https');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Neamt code is 29. Let's try to query by JUDET='NEAMT'
const url = "https://geoportal.ancpi.ro/arcgis/rest/services/administrativ/UAT_Grupate/MapServer/0/query?where=judet='NEAMT'&outFields=nume_uat,SIRUTA&f=json";

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.features) {
        console.log(`Found ${json.features.length} UATs for NEAMT.`);
        json.features.slice(0, 5).forEach(f => {
            console.log(`- ${f.attributes.nume_uat} (SIRUTA: ${f.attributes.SIRUTA})`);
        });
      } else {
        console.log("No UATs found or error:", data);
      }
    } catch (e) {
      console.log("Error parsing:", e.message);
      console.log("Raw data:", data);
    }
  });
}).on('error', err => console.error(err));
