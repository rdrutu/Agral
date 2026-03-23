'use server';

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function getPhysicalBlockAt(lat: number, lng: number) {
  try {
    const query = `
      SELECT 
        fbid, 
        uat, 
        judet, 
        suprafata as "suprafataHa",
        ST_AsGeoJSON(geometry)::json as geometry
      FROM physical_blocks
      WHERE ST_Intersects(
        geometry, 
        ST_SetSRID(ST_Point($1, $2), 4326)
      )
      LIMIT 1;
    `;

    const result = await pool.query(query, [lng, lat]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    
    // Formatăm pentru a se potrivi cu restul aplicației (care așteaptă proprietăți în feature)
    return {
      type: 'Feature',
      geometry: row.geometry,
      properties: {
        fbid: row.fbid,
        uat: row.uat,
        judet: row.judet,
        suprafataHa: row.suprafataHa,
        // Aliniem câmpurile pentru popup (care caută NATIONAL_CADASTRAL_REFERENCE etc)
        NATIONAL_CADASTRAL_REFERENCE: `Bloc: ${row.fbid}`,
        UATS: `${row.uat}, ${row.judet}`,
      }
    };
  } catch (err) {
    console.error('Error querying local physical blocks:', err);
    throw new Error('Eroare la interogarea bazei de date locale');
  }
}
