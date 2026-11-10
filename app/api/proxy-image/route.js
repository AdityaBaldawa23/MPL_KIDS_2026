/**
 * GET /api/proxy-image
 * Proxies external images (Cloudinary) for client-side PDF generation.
 * Without this, browser CORS blocks cross-origin image fetching from canvas/jsPDF.
 *
 * Usage: /api/proxy-image?url=https://res.cloudinary.com/...
 */
import { NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  'res.cloudinary.com',
  // add other allowed CDN hostnames here
];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 });
  }

  let parsed;
  try { parsed = new URL(imageUrl); }
  catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }); }

  /* whitelist check */
  const isAllowed = ALLOWED_ORIGINS.some(origin => parsed.hostname.endsWith(origin));
  if (!isAllowed) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
  }

  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': 'NextJS-ImageProxy/1.0' },
      // allow up to 5 MB
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream error' }, { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('Image proxy error:', err);
    return NextResponse.json({ error: 'Proxy failed' }, { status: 500 });
  }
}