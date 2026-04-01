const https = require('https');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function testSpecific() {
  const patterns = [
    "RO.29.120922.50170", // Horia Commune
    "RO.29.120931.50170", // Horia Village
    "RO.29.%.50170"       // Wildcard
  ];

  for (const pattern of patterns) {
    console.log(`Testing: ${pattern}`);
    const url = `https://geoportal.ancpi.ro/maps/rest/services/eterra3_publish/MapServer/1/query?where=INSPIRE_ID%20LIKE%20'${pattern}'&f=json&outFields=*&returnGeometry=true&outSR=4326`;
    
    await new Promise((resolve) => {
      const req = https.get(url, { headers: { 'Referer': 'https://geoportal.ancpi.ro/' } }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.features && json.features.length > 0) {
              console.log("[OK] Found result!");
              console.log("Attributes:", json.features[0].attributes);
            } else {
              console.log("[EMPTY] No result.");
            }
          } catch (e) {
            console.log("[ERROR] Parse error.");
          }
          resolve();
        });
      });
      req.on('error', (e) => {
        console.log(`[ERROR] ${e.message}`);
        resolve();
      });
    });
  }
}

testSpecific();
