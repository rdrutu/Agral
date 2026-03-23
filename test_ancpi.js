process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function checkService(url) {
  console.log(`--- Checking: ${url} ---`);
  try {
    const response = await fetch(`${url}?f=json`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://geoportal.ancpi.ro/imobile.html',
      }
    });
    
    if (response.status !== 200) {
      console.log(`Status: ${response.status}`);
      return;
    }
    const data = await response.json();
    console.log(`singleFusedMapCache: ${data.singleFusedMapCache}`);
    if (data.tileInfo) {
      console.log('tileInfo found!');
    } else {
      console.log('No tileInfo.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

async function run() {
  // Check the /maps/ endpoint that the user suggested
  await checkService('https://geoportal.ancpi.ro/maps/rest/services/eterra3_publish/MapServer');
}

run();
