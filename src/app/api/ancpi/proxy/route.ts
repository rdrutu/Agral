import { NextResponse } from 'next/server';
import https from 'https';

// Force bypass SSL checks for ANCPI interactions as they use internal govt certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Agent refolosibil pentru performanță și pentru a asigura bypass-ul SSL corect
const insecureAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
});

async function fetchWithRetry(options: https.RequestOptions, targetUrl: URL, retries = 2): Promise<Response> {
  return new Promise<Response>((resolve) => {
    const attempt = (remaining: number) => {
      const req = https.request(options, (res) => {
        const chunks: any[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          
          // Dacă ANCPI returnează 5xx și mai avem retry-uri
          if (res.statusCode && res.statusCode >= 500 && remaining > 0) {
            // console.warn(`[ANCPI Proxy] Retry (${remaining} left) for ${targetUrl}`);
            setTimeout(() => attempt(remaining - 1), 500);
            return;
          }

          const contentType = res.headers['content-type'];
          
          // Tratăm erorile HTTP >= 400 (care n-au fost prinse de retry)
          if (res.statusCode && res.statusCode >= 400) {
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
            } catch {
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
        // Nu facem retry la timeout total pentru a nu bloca request-ul prea mult
        resolve(NextResponse.json({ 
          error: 'ANCPI Timeout', 
          message: 'Serverul ANCPI nu a răspuns în 15 secunde.' 
        }, { status: 504 }));
      });

      req.on('error', (e) => {
        if (remaining > 0) {
          // console.warn(`[ANCPI Proxy] Retry after error: ${e.message}`);
          setTimeout(() => attempt(remaining - 1), 500);
        } else {
          resolve(NextResponse.json({ 
            error: 'Proxy Connection Error', 
            message: e.message,
            code: (e as any).code,
            url: targetUrl.toString()
          }, { status: 502 }));
        }
      });

      req.end();
    };

    attempt(retries);
  });
}

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

    const options: https.RequestOptions = {
      hostname: targetUrl.hostname,
      path: targetUrl.pathname + targetUrl.search,
      method: 'GET',
      timeout: 15000,
      agent: insecureAgent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://geoportal.ancpi.ro/imobile.html',
        'Accept': '*/*',
      }
    };

    return await fetchWithRetry(options, targetUrl);

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Proxy Internal Error', 
      message: error.message 
    }, { status: 500 });
  }
}
