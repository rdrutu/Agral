import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Utilizăm un Pool pentru a reutiliza conexiunile către Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const params = await context.params;
  const z = parseInt(params.z);
  const x = parseInt(params.x);
  const y = parseInt(params.y);

  // Validare basică pentru coordonatele tile-ului
  if (isNaN(z) || isNaN(x) || isNaN(y)) {
    return new NextResponse("Invalid coordinates", { status: 400 });
  }

  try {
    // Query optimizat pentru PostGIS care generează Vector Tiles (MVT)
    // 1. ST_TileEnvelope creează bounding box-ul tile-ului în proiecția Web Mercator (3857)
    // 2. ST_AsMVTGeom transformă poligoanele noastre în coordonate relative tile-ului
    // 3. ST_AsMVT agregă totul într-un format binary PBF
    const query = `
      WITH 
      bounds AS (
        SELECT ST_TileEnvelope($1, $2, $3) AS geom
      ),
      mvtgeom AS (
        SELECT 
          ST_AsMVTGeom(
            ST_Transform(geometry, 3857), 
            bounds.geom,
            4096, -- Rezoluție (extent)
            256,  -- Buffer
            true  -- Clip geometry
          ) AS geom, 
          fbid, 
          uat,
          judet,
          suprafata
        FROM physical_blocks, bounds
        WHERE ST_Intersects(ST_Transform(geometry, 3857), bounds.geom)
      )
      SELECT ST_AsMVT(mvtgeom.*, 'lpis_blocks') AS mvt FROM mvtgeom;
    `;

    const result = await pool.query(query, [z, x, y]);
    const mvt = result.rows[0]?.mvt;

    if (!mvt) {
      // Dacă nu există date în acest tile, returnăm un răspuns gol (204 No Content)
      return new NextResponse(null, { status: 204 });
    }

    return new NextResponse(mvt, {
      headers: {
        'Content-Type': 'application/x-google-protobuf',
        'Cache-Control': 'public, max-age=86400', // Cache 24h
      },
    });
  } catch (err) {
    console.error('Vector Tile Error:', err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
