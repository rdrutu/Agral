import { NextResponse } from 'next/server';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const z = searchParams.get('z');
    const x = searchParams.get('x');
    const y = searchParams.get('y');

    if (!z || !x || !y) {
      return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    const targetUrl = `https://geoportal.ancpi.ro/maps/rest/services/eterra3_publish/MapServer/tile/${z}/${y}/${x}`;
    
    // console.log(`[Tile Proxy] Fetching: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://geoportal.ancpi.ro/',
      },
      cache: 'force-cache', // Încercăm să cache-uim tile-urile pe server/CDN
      next: { revalidate: 86400 } // 24 ore
    });

    if (!response.ok) {
       // Dacă e 404 (tile lipsă în cache-ul lor sau zonă neacoperită pe zoom mare), returnăm un transparent pixel sau statusul lor
       if (response.status === 404) {
         return new NextResponse(null, { status: 404 });
       }
       return new NextResponse(null, { status: response.status });
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error: any) {
    console.error(`[Tile Proxy] Error:`, error.message);
    return new NextResponse(null, { status: 500 });
  }
}
