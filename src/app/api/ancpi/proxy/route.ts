import { NextResponse } from 'next/server';

// Încercăm să păstrăm bypass-ul SSL global pentru fetch pe server
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const baseUrl = searchParams.get('url');

    if (!baseUrl) {
      return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }

    const isAncpi = baseUrl.includes('ancpi.ro');
    const isApia = baseUrl.includes('apia.org.ro');
    const isArcgis = baseUrl.includes('arcgis.com') || baseUrl.includes('arcgisonline.com');

    if (!isAncpi && !isApia && !isArcgis) {
      return NextResponse.json({ error: 'Invalid target domain' }, { status: 400 });
    }

    // Identificăm Referer-ul potrivit
    let referer = 'https://geoportal.ancpi.ro/';
    if (isApia) referer = 'https://inspire.apia.org.ro/';
    if (isArcgis) referer = 'https://www.arcgis.com/';

    const targetUrl = new URL(baseUrl);
    // NU mai forțăm HTTPS dacă sursa e HTTP (unele servere ANCPI au SSL defect)
    // targetUrl.protocol = 'https:';

    searchParams.forEach((value, key) => {
      if (key !== 'url') {
        targetUrl.searchParams.set(key, value);
      }
    });

    const fullUrl = targetUrl.toString();
    console.log(`[ANCPI Proxy GET] Fetching: ${fullUrl}`);

    const response = await fetch(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': referer,
        'Origin': new URL(referer).origin,
        'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      console.warn(`[ANCPI Proxy GET] Target ${fullUrl} returned ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    return new NextResponse(buffer, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Proxy-Target': targetUrl.origin,
      },
    });

  } catch (error: any) {
    console.error(`[ANCPI Proxy GET] Fatal Error: ${error.message}`);
    return NextResponse.json({
      error: 'Proxy Error',
      message: error.message,
    }, { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const baseUrl = searchParams.get('url');
    const body = await request.json();

    if (!baseUrl) {
      return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }

    if (!baseUrl.includes('ancpi.ro') && !baseUrl.includes('apia.org.ro')) {
      return NextResponse.json({ error: 'Invalid target domain' }, { status: 400 });
    }

    const isApia = baseUrl.includes('apia.org.ro');
    const referer = isApia 
      ? 'https://inspire.apia.org.ro/' 
      : 'https://geoportal.ancpi.ro/';

    const targetUrl = new URL(baseUrl);
    if (targetUrl.protocol !== 'https:') {
      targetUrl.protocol = 'https:';
    }

    console.log(`[ANCPI Proxy POST] Fetching: ${targetUrl.toString()}`);

    const response = await fetch(targetUrl.toString(), {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': referer,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(body).toString(),
      signal: AbortSignal.timeout(60000),
    });

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      const text = await response.text();
      return new NextResponse(text, {
        status: response.status,
        headers: { 'Content-Type': contentType || 'text/plain' }
      });
    }

  } catch (error: any) {
    console.error(`[ANCPI Proxy POST] Error: ${error.message}`);
    return NextResponse.json({
      error: 'Proxy Error',
      message: error.message,
    }, { status: 502 });
  }
}
