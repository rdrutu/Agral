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

    // Convertim URL-ul și forțăm HTTPS
    const targetUrl = new URL(baseUrl);
    targetUrl.protocol = 'https:';

    searchParams.forEach((value, key) => {
      if (key !== 'url') {
        targetUrl.searchParams.set(key, value);
      }
    });

    console.log(`[ANCPI Proxy] Fetching: ${targetUrl.toString()}`);

    const response = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://geoportal.ancpi.ro/imobile.html',
        'Accept': '*/*',
      },
      // Timeout de 15 secunde folosind standardul web
      signal: AbortSignal.timeout(60000),
    });

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    // Returnăm răspunsul exact așa cum vine de la ANCPI (cu datele binare)
    return new NextResponse(buffer, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'X-ANCPI-Status': response.status.toString(),
      },
    });

  } catch (error: any) {
    console.error(`[ANCPI Proxy] Error: ${error.message}`);
    return NextResponse.json({
      error: 'Proxy Error',
      message: error.message,
      code: error.code || 'UNKNOWN',
    }, { status: 502 });
  }
}
