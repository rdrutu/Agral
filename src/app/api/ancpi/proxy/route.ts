import { NextResponse } from 'next/server';
import https from 'https';
import http from 'http';

// Force bypass SSL checks for ANCPI interactions as they use internal govt certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Agent HTTPS refolosibil
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
});

// Agent HTTP refolosibil
const httpAgent = new http.Agent({
  keepAlive: true,
});

async function fetchWithRetry(options: any, transport: any, targetUrl: URL, retries = 2): Promise<Response> {
  return new Promise<Response>((resolve) => {
    const attempt = (remaining: number) => {
      const req = transport.request(options, (res: any) => {
        const chunks: any[] = [];
        res.on('data', (chunk: any) => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          
          if (res.statusCode && res.statusCode >= 500 && remaining > 0) {
            setTimeout(() => attempt(remaining - 1), 500);
            return;
          }

          const contentType = res.headers['content-type'];
          
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
        resolve(NextResponse.json({ 
          error: 'ANCPI Timeout', 
          message: 'Serverul ANCPI nu a răspuns în 15 secunde.' 
        }, { status: 504 }));
      });

      req.on('error', (e: any) => {
        if (remaining > 0) {
          setTimeout(() => attempt(remaining - 1), 500);
        } else {
          resolve(NextResponse.json({ 
            error: 'Proxy Connection Error', 
            message: e.message,
            code: e.code,
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

    const isHttps = targetUrl.protocol === 'https:';
    const transport = isHttps ? https : http;
    const agent = isHttps ? httpsAgent : httpAgent;

    const options = {
      hostname: targetUrl.hostname,
      port: targetUrl.port || (isHttps ? 443 : 80),
      path: targetUrl.pathname + targetUrl.search,
      method: 'GET',
      timeout: 15000,
      agent: agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://geoportal.ancpi.ro/imobile.html',
        'Accept': '*/*',
      }
    };

    return await fetchWithRetry(options, transport, targetUrl);

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Proxy Internal Error', 
      message: error.message 
    }, { status: 500 });
  }
}
