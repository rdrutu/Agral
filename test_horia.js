const https = require('https');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function findSirutaAndSearch() {
  const judet = "NEAMT";
  const locality = "HORIA";
  const nrCad = "50170";
  const judetCode = "29";

  console.log(`Searching for SIRUTA of ${locality}, ${judet}...`);

  // Step 1: Find SIRUTA
  // Note: UAT_Grupate might need specialized encoding or referer. 
  // I'll try to get it from a public service first.
  const uatUrl = `https://geoportal.ancpi.ro/arcgis/rest/services/administrativ/UAT_Grupate/MapServer/0/query?where=judet='${judet}'%20AND%20nume_uat='${locality}'&outFields=SIRUTA&f=json`;
  
  const sirutaData = await new Promise((resolve) => {
    const req = https.get(uatUrl, { headers: { 'Referer': 'https://geoportal.ancpi.ro/' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', () => resolve(null));
  });

  let siruta = null;
  try {
    const json = JSON.parse(sirutaData);
    if (json.features && json.features.length > 0) {
      siruta = json.features[0].attributes.SIRUTA;
      console.log(`Found SIRUTA for ${locality}: ${siruta}`);
    } else {
        console.log("Locality not found in UAT_Grupate, trying fallback...");
    }
  } catch (e) {
    console.log("Error parsing UAT data.");
  }

  // Fallback: If we can't get SIRUTA, we'll try to find it by wildcard in eterra
  const searchPatterns = siruta 
    ? [`RO.${judetCode}.${siruta}.${nrCad}`]
    : [`RO.${judetCode}.%.${nrCad}`, `%.${nrCad}`];

  for (const pattern of searchPatterns) {
    console.log(`\nTesting Query with pattern: ${pattern}`);
    const queryUrl = `https://geoportal.ancpi.ro/maps/rest/services/eterra3_publish/MapServer/1/query?where=INSPIRE_ID%20LIKE%20'${pattern}'&f=json&outFields=*&returnGeometry=true&outSR=4326`;
    
    await new Promise((resolve) => {
      const req = https.get(queryUrl, { headers: { 'Referer': 'https://geoportal.ancpi.ro/' } }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.features && json.features.length > 0) {
              console.log("[OK] Result found!");
              console.log("Attributes:", json.features[0].attributes);
            } else {
              console.log("[EMPTY] No result for this pattern.");
            }
          } catch (e) {
            console.log("[ERROR] Parse error or HTTP failure.");
          }
          resolve();
        });
      });
      req.on('error', (e) => {
        console.log(`[ERROR] Request failed: ${e.message}`);
        resolve();
      });
    });
  }
}

findSirutaAndSearch();
