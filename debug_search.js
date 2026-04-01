const https = require('https');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Neamt = 29
// Search = 50170
const query1 = "https://geoportal.ancpi.ro/maps/rest/services/eterra3_publish/MapServer/1/query?where=INSPIRE_ID+LIKE+%27RO.29.%.50170%27&f=json&outFields=*&returnGeometry=true&outSR=4326";
const query2 = "https://geoportal.ancpi.ro/maps/rest/services/eterra3_publish/MapServer/1/query?where=INSPIRE_ID+LIKE+%27%2550170%27&f=json&outFields=*&returnGeometry=true&outSR=4326";

function doQuery(url, name) {
    https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log(`--- ${name} ---`);
            console.log(data.substring(0, 500));
            if (data.includes("features\":[]")) {
                console.log("No features found");
            } else {
                console.log("Found features!");
                const json = JSON.parse(data);
                if (json.features && json.features.length > 0) {
                   console.log("Fields in first feature:", Object.keys(json.features[0].attributes));
                   console.log("Values:", json.features[0].attributes);
                }
            }
        });
    }).on('error', err => console.error(err));
}

doQuery(query1, "Query 1 (RO.29.%.50170)");
doQuery(query2, "Query 2 (%.50170)");
