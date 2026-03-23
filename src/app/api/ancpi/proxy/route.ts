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

    if (!baseUrl.includes('ancpi.ro') && !baseUrl.includes('apia.org.ro')) {
      return NextResponse.json({ error: 'Invalid target domain' }, { status: 400 });
    }

    // Identificăm Referer-ul potrivit
    const isApia = baseUrl.includes('apia.org.ro');
    const referer = isApia 
      ? 'https://inspire.apia.org.ro/' 
      : 'https://geoportal.ancpi.ro/imobile.html';

    const targetUrl = new URL(baseUrl);
    // Forțăm HTTPS pentru ANCPI/APIA dacă e cazul, dar respectăm protocolul dacă e deja HTTPS
    if (targetUrl.protocol !== 'https:') {
      targetUrl.protocol = 'https:';
    }

    searchParams.forEach((value, key) => {
      if (key !== 'url') {
        targetUrl.searchParams.set(key, value);
      }
    });

    console.log(`[ANCPI Proxy GET] Fetching: ${targetUrl.toString()}`);

    const response = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': referer,
        'Accept': '*/*',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(60000),
    });

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/json';

    return new NextResponse(buffer, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'X-Proxy-Target': targetUrl.origin,
      },
    });

  } catch (error: any) {
    console.error(`[ANCPI Proxy GET] Error: ${error.message}`);
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
      : 'https://geoportal.ancpi.ro/imobile.html';

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
