import { NextResponse } from 'next/server';
import https from 'https';

// Force bypass SSL checks for ANCPI interactions as they use internal govt certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const baseUrl = searchParams.get('url');

    if (!baseUrl) {
      return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }

    const targetUrl = new URL(baseUrl);
    searchParams.forEach((value, key) => {
      if (key !== 'url') {
        targetUrl.searchParams.set(key, value);
      }
    });

    if (!targetUrl.hostname.includes('ancpi.ro')) {
      return NextResponse.json({ error: 'Invalid target domain' }, { status: 400 });
    }

    // console.log(`[ANCPI Proxy] Fetching via HTTPS module: ${targetUrl.toString()}`);

    return new Promise((resolve) => {
      const options = {
        hostname: targetUrl.hostname,
        path: targetUrl.pathname + targetUrl.search,
        method: 'GET',
        timeout: 45000, // 45s total timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Referer': 'https://geoportal.ancpi.ro/imobile.html',
          'Accept': '*/*',
        },
        rejectUnauthorized: false
      };

      const req = https.request(options, (res) => {
        const contentType = res.headers['content-type'];
        const chunks: any[] = [];

        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          
          if (res.statusCode && res.statusCode >= 400) {
            // console.error(`[ANCPI Proxy] ANCPI Error: ${res.statusCode}`);
            resolve(NextResponse.json({ 
                error: `ANCPI responded with ${res.statusCode}`,
                details: buffer.toString('utf-8').substring(0, 200),
                targetUrl: targetUrl.toString()
            }, { status: res.statusCode }));
            return;
          }

          if (contentType?.includes('application/json') || targetUrl.toString().includes('f=json')) {
            try {
              const data = JSON.parse(buffer.toString('utf-8'));
              resolve(NextResponse.json(data));
            } catch (e) {
              // Not actual JSON, return as is
              resolve(new NextResponse(buffer, {
                headers: { 'Content-Type': contentType || 'application/octet-stream' }
              }));
            }
          } else {
            resolve(new NextResponse(buffer, {
              headers: { 
                'Content-Type': contentType || 'image/png',
                'Cache-Control': 'public, max-age=3600'
              }
            }));
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(NextResponse.json({ 
          error: 'ANCPI Timeout', 
          message: 'Serverul ANCPI nu a răspuns în 45 de secunde.' 
        }, { status: 504 }));
      });

      req.on('error', (e) => {
        // console.error('ANCPI Proxy HTTPS Error:', e);
        resolve(NextResponse.json({ 
          error: 'Proxy Connection Error', 
          message: e.message 
        }, { status: 502 }));
      });

      req.end();
    });

  } catch (error: any) {
    // console.error('ANCPI Proxy Fatal Error:', error);
    return NextResponse.json({ 
      error: 'Proxy Internal Error', 
      message: error.message 
    }, { status: 500 });
  }
}
