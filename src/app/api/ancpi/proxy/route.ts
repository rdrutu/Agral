import { NextResponse } from 'next/server';

// Force bypass SSL checks for ANCPI interactions as they use internal govt certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
// Increase global fetch connect timeout for undici (used by Next.js fetch)
process.env.UNDICI_CONNECT_TIMEOUT = '60000'; 

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
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout - ANCPI servers are slow

    let response: Response;
    let attempts = 0;
    const maxAttempts = 2;

    while (true) {
      try {
        attempts++;
        response = await fetch(targetUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Referer': 'https://geoportal.ancpi.ro/imobile.html',
            'Accept': '*/*',
          },
          cache: 'no-store',
          signal: controller.signal,
        });
        break; // Success
      } catch (err: any) {
        if (attempts >= maxAttempts) throw err;
        console.log(`[ANCPI Proxy] Attempt ${attempts} failed, retrying...`);
        // Wait 1s before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    clearTimeout(timeout);

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
    if (error.name === 'AbortError') {
      return NextResponse.json({ 
        error: 'ANCPI Timeout', 
        message: 'Serverul ANCPI nu a răspuns în 30 de secunde. Încearcă din nou peste câteva momente.'
      }, { status: 504 });
    }
    console.error('ANCPI Proxy Error:', error);
    return NextResponse.json({ 
      error: 'Proxy Internal Error', 
      message: error.message,
      stack: error.stack?.substring(0, 200)
    }, { status: 500 });
  }
}
