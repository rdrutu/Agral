const https = require('https');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function testUserMethod() {
  const uat = "HORIA";
  const nrCad = "50170";
  const baseUrl = "https://geoportal.ancpi.ro/maps/rest/services/eterra3_publish/MapServer/1/query";
  
  const params = new URLSearchParams({
    where: `UAT_NAME = '${uat.toUpperCase()}' AND NR_CADASTRAL = '${nrCad}'`,
    outFields: "*",
    outSR: "4326",
    f: "geojson"
  });

  const url = `${baseUrl}?${params.toString()}`;
  console.log(`Testing URL: ${url}`);

  await new Promise((resolve) => {
    https.get(url, { headers: { 'Referer': 'https://geoportal.ancpi.ro/' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.features && json.features.length > 0) {
            console.log("[OK] Result found!");
            console.log("Feature properties:", json.features[0].properties);
            console.log("Geometry Type:", json.features[0].geometry.type);
          } else {
            console.log("[EMPTY] No result found.");
            console.log("Raw response (start):", data.substring(0, 200));
          }
        } catch (e) {
          console.log("[ERROR] Parse error.");
          console.log("Raw response:", data);
        }
        resolve();
      });
    }).on('error', (e) => {
      console.log(`[ERROR] ${e.message}`);
      resolve();
    });
  });
}

testUserMethod();
