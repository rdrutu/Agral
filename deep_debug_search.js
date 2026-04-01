const https = require('https');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const services = [
    "https://geoportal.ancpi.ro/maps/rest/services/eterra3_publish/MapServer/1/query",
    "https://geoportal.ancpi.ro/maps/rest/services/imobile/Imobile/MapServer/1/query"
];

// Neamt code is 29.
// Possible INSPIRE_ID formats:
// RO.29.xxxx.50170
// RO.29.50170 (if it's simple?)
// OR just search by NATIONAL_CADASTRAL_REFERENCE if it exists there.

const tests = [
    "INSPIRE_ID LIKE '%50170'",
    "NATIONAL_CADASTRAL_REFERENCE = '50170'",
    "nr_cadastral = '50170'",
    "nc = '50170'"
];

async function runTests() {
    for (const service of services) {
        console.log(`\nTesting Service: ${service}`);
        for (const test of tests) {
            const url = `${service}?where=${encodeURIComponent(test)}&f=json&outFields=*&returnGeometry=true&outSR=4326&resultRecordCount=1`;
            
            await new Promise((resolve) => {
                const req = https.get(url, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        try {
                            const json = JSON.parse(data);
                            if (json.features && json.features.length > 0) {
                                console.log(`  [SUCCESS] ${test} -> Found 1!`);
                                console.log(`    Sample INSPIRE_ID: ${json.features[0].attributes.INSPIRE_ID}`);
                            } else if (json.error) {
                                console.log(`  [ERROR] ${test} -> ${json.error.message}`);
                            } else {
                                console.log(`  [EMPTY] ${test} -> No results`);
                            }
                        } catch (e) {
                            console.log(`  [FAIL] ${test} -> HTTP ${res.statusCode}`);
                        }
                        resolve();
                    });
                });
                req.on('error', (e) => {
                    console.log(`  [FAIL] ${test} -> ${e.message}`);
                    resolve();
                });
            });
        }
    }
}

runTests();
