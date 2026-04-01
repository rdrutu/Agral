import { NextResponse } from 'next/server';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const baseUrl = searchParams.get('url');

    if (!baseUrl) {
      return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }

    // Convert WMS parameters to ArcGIS REST export parameters
    const bbox = searchParams.get('bbox') || '';
    const width = searchParams.get('width') || '256';
    const height = searchParams.get('height') || '256';
    // const layers = searchParams.get('layers') || '1';
    
    // In caz ca url-ul e deja WMS il facem export
    const targetUrlString = baseUrl.replace('/WMSServer', '/export');
    const targetUrl = new URL(targetUrlString);

    // ArcGIS export params
    targetUrl.searchParams.set('bbox', bbox);
    targetUrl.searchParams.set('size', `${width},${height}`);
    targetUrl.searchParams.set('format', 'png32');
    targetUrl.searchParams.set('transparent', 'true');
    targetUrl.searchParams.set('f', 'image');
    targetUrl.searchParams.set('bboxSR', '3857');
    targetUrl.searchParams.set('imageSR', '3857');
    
    // Pentru a asigura performanța și a nu bloca serverul,
    // extragem si trimitem layers show.
    // Daca clientul a dat `layers=0` -> `layers=show:0`
    const reqLayers = searchParams.get('layers');
    if (reqLayers) {
      targetUrl.searchParams.set('layers', `show:${reqLayers}`);
    }

    console.log(`[WMS to ArcGIS Proxy] Translated to: ${targetUrl.toString()}`);

    const response = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://geoportal.ancpi.ro/',
        'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      console.warn(`[WMS Proxy] Target returned ${response.status}`);
      return new NextResponse('Error fetching map image', { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error: any) {
    console.error(`[WMS Proxy] Error:`, error);
    return new NextResponse('Internal Proxy Error', { status: 500 });
  }
}
