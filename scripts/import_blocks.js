const shapefile = require('shapefile');
const proj4 = require('proj4');
const { Client } = require('pg');
const path = require('path');
require('dotenv').config();

// Definiție Stereo 70 pentru proj4 (EPSG:31700)
const STEREO70 = '+proj=sterea +lat_0=46 +lon_0=25 +k=0.99975 +x_0=500000 +y_0=500000 +ellps=krass +units=m +no_defs';
const WGS84 = 'EPSG:4326';

async function runImport() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to Supabase...');

  // 1. Asigurare PostGIS și tabel
  console.log('Ensuring PostGIS and table...');
  await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');
  
  // Ștergem tot pentru un import curat
  console.log('Cleaning existing data...');
  await client.query('DROP TABLE IF EXISTS physical_blocks CASCADE;');
  
  await client.query(`
    CREATE TABLE IF NOT EXISTS physical_blocks (
      fbid TEXT PRIMARY KEY,
      uat TEXT,
      judet TEXT,
      suprafata FLOAT8,
      geometry geometry(MultiPolygon, 4326)
    );
  `);

  console.log('Ensuring spatial index...');
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_physical_blocks_geom 
    ON physical_blocks 
    USING GIST (geometry);
  `);

  const shpPath = path.join(__dirname, '../blocuri_fizice_2025/blocuri_fizice.shp');
  const dbfPath = path.join(__dirname, '../blocuri_fizice_2025/blocuri_fizice.dbf');

  const source = await shapefile.open(shpPath, dbfPath);
  let count = 0;
  let batch = [];
  const BATCH_SIZE = 500;

  console.log('Starting import loop...');

  while (true) {
    const result = await source.read();
    if (result.done) break;

    const feature = result.value;
    const props = feature.properties;
    
    // Reproiectare geometrie
    let reprojectedCoords;
    if (feature.geometry.type === 'Polygon') {
      reprojectedCoords = feature.geometry.coordinates.map(ring => 
        ring.map(coord => proj4(STEREO70, WGS84, coord))
      );
    } else {
      // MultiPolygon
      reprojectedCoords = feature.geometry.coordinates.map(polygon => 
        polygon.map(ring => 
          ring.map(coord => proj4(STEREO70, WGS84, coord))
        )
      );
    }

    const geojson = {
      type: 'MultiPolygon',
      coordinates: feature.geometry.type === 'Polygon' ? [reprojectedCoords] : reprojectedCoords
    };

    batch.push({
      fbid: props.fbid,
      uat: props.nume_com,
      judet: props.judet,
      suprafata: props.a0_aria,
      geom: JSON.stringify(geojson)
    });

    if (batch.length >= BATCH_SIZE) {
      await insertBatch(client, batch);
      count += batch.length;
      console.log(`Imported ${count} features...`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await insertBatch(client, batch);
    count += batch.length;
  }

  console.log(`Total imported: ${count}`);
  await client.end();
}

async function insertBatch(client, batch) {
  // Deduplicare în cadrul batch-ului
  const map = new Map();
  for (const item of batch) {
    if (item.fbid) {
      map.set(item.fbid, item);
    }
  }
  const uniqueBatch = Array.from(map.values());
  
  if (uniqueBatch.length === 0) return;

  const values = [];
  const lines = uniqueBatch.map((item, i) => {
    const offset = i * 5;
    values.push(item.fbid, item.uat, item.judet, item.suprafata, item.geom);
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, ST_Simplify(ST_SetSRID(ST_GeomFromGeoJSON($${offset + 5}), 4326), 0.00001))`;
  });

  const query = `
    INSERT INTO physical_blocks (fbid, uat, judet, suprafata, geometry)
    VALUES ${lines.join(', ')}
    ON CONFLICT (fbid) DO UPDATE SET
      uat = EXCLUDED.uat,
      judet = EXCLUDED.judet,
      suprafata = EXCLUDED.suprafata,
      geometry = EXCLUDED.geometry;
  `;

  await client.query(query, values);
}

runImport().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
