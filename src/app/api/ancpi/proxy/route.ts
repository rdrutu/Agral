import { NextResponse } from 'next/server';

// ANCPI Geoportal often has SSL certificate issues that Node.js fetch doesn't trust by default
// Force bypass SSL checks for ANCPI interactions as they use internal govt certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const baseUrl = searchParams.get('url');

    if (!baseUrl) {
      return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }

    // Reconstruct target URL
    const urlObj = new URL(baseUrl);
    searchParams.forEach((value, key) => {
      if (key !== 'url') {
        urlObj.searchParams.set(key, value);
      }
    });
    const targetUrl = urlObj.toString();

    // Ensure it's an ANCPI URL for security
    if (!targetUrl.includes('ancpi.ro')) {
      return NextResponse.json({ error: 'Invalid target domain' }, { status: 400 });
    }

    console.log(`[ANCPI Proxy] Fetching: ${targetUrl}`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://geoportal.ancpi.ro/imobile.html',
        'Origin': 'https://geoportal.ancpi.ro',
        'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': targetUrl.includes('tile') ? 'image' : 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
      },
      cache: 'no-store',
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      console.error(`[ANCPI Proxy] ANCPI Error: ${response.status} ${response.statusText}`);
    }

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ 
        error: `ANCPI responded with ${response.status}`,
        details: text.substring(0, 200),
        targetUrl
      }, { status: response.status });
    }

    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json') || targetUrl.includes('f=json')) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    const imageBuffer = await response.arrayBuffer();
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType || 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('ANCPI Proxy Error:', error);
    return NextResponse.json({ 
      error: 'Proxy Internal Error', 
      message: error.message,
      stack: error.stack?.substring(0, 200)
    }, { status: 500 });
  }
}
