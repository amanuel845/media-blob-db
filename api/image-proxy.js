// /api/image-proxy.js
// Same-origin CORS proxy for TikTok CDN images.
// Streams the upstream body back to the caller, adds Access-Control-Allow-Origin.

export const config = { runtime: 'edge' };

// ----------------------------------------------------------------------------
// Config
// ----------------------------------------------------------------------------
// Comma-separated allowlist of host suffixes, e.g.
//   "tiktokcdn-us.com,tiktokcdn.com,tiktok.com"
// If unset, defaults to TikTok's known CDN suffixes.
const DEFAULT_ALLOWED = [
  'tiktokcdn-us.com',
  'tiktokcdn.com',
  'tiktok.com',
  'ibyteimg.com',
  'byteoversea.com',
].join(',');

const ALLOWED = (process.env.PROXY_ALLOWED_HOSTS || DEFAULT_ALLOWED)
  .split(',')
  .map(function (s) { return s.trim().toLowerCase(); })
  .filter(Boolean);

const TIMEOUT_MS = 15000;
const MAX_BYTES  = 20 * 1024 * 1024;   // 20 MB cap

// ----------------------------------------------------------------------------
// Guardrails
// ----------------------------------------------------------------------------
function isPrivateHost(hostname) {
  return /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|\[?::1\]?$)/i
    .test(hostname);
}

function isAllowedHost(hostname) {
  var h = hostname.toLowerCase();
  return ALLOWED.some(function (suffix) {
    return h === suffix || h.endsWith('.' + suffix);
  });
}

// ----------------------------------------------------------------------------
// Handler
// ----------------------------------------------------------------------------
export default async function handler(req) {
  var cors = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age':       '86400'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: cors });
  }

  var reqUrl = new URL(req.url);
  var target = reqUrl.searchParams.get('url');

  if (!target) {
    return new Response('Missing url parameter', { status: 400, headers: cors });
  }

  var parsed;
  try {
    parsed = new URL(target);
  } catch (e) {
    return new Response('Invalid url', { status: 400, headers: cors });
  }

  if (parsed.protocol !== 'https:') {
    return new Response('Only https:// urls are allowed', { status: 400, headers: cors });
  }

  if (isPrivateHost(parsed.hostname)) {
    return new Response('Host not allowed', { status: 403, headers: cors });
  }

  if (!isAllowedHost(parsed.hostname)) {
    return new Response(
      'Host not allowed: ' + parsed.hostname + ' (configured: ' + ALLOWED.join(', ') + ')',
      { status: 403, headers: cors }
    );
  }

  // Optional shared secret. Set IMAGE_PROXY_KEY on Vercel to enable.
  var requiredKey = process.env.IMAGE_PROXY_KEY;
  if (requiredKey) {
    var provided = req.headers.get('x-proxy-key') || reqUrl.searchParams.get('key');
    if (provided !== requiredKey) {
      return new Response('Unauthorized', { status: 401, headers: cors });
    }
  }

  // ---- Upstream fetch ----
  var upstream;
  try {
    upstream = await fetch(parsed.toString(), {
      method:  req.method,
      headers: {
        'User-Agent': req.headers.get('user-agent') || 'tiktok-fetcher-image-proxy/1.0',
        'Accept':     'image/*,*/*;q=0.8'
      },
      signal:   AbortSignal.timeout(TIMEOUT_MS),
      redirect: 'follow'
    });
  } catch (err) {
    var msg = (err && err.message) ? err.message : 'unknown';
    return new Response('Upstream fetch failed: ' + msg, { status: 502, headers: cors });
  }

  if (!upstream.ok) {
    return new Response(
      'Upstream ' + upstream.status + ' ' + (upstream.statusText || ''),
      { status: upstream.status, headers: cors }
    );
  }

  var contentLength = parseInt(upstream.headers.get('content-length') || '0', 10);
  if (contentLength > MAX_BYTES) {
    return new Response('Payload too large', { status: 413, headers: cors });
  }

  // ---- Response ----
  var headers = new Headers(cors);
  headers.set('Content-Type', upstream.headers.get('content-type') || 'application/octet-stream');

  // Cache the image for a while. TikTok URLs carry signed query params,
  // so caching by full URL is safe and immutable within their lifetime.
  headers.set('Cache-Control', 'public, max-age=3600, immutable');

  var etag = upstream.headers.get('etag');
  if (etag) headers.set('ETag', etag);

  var lastMod = upstream.headers.get('last-modified');
  if (lastMod) headers.set('Last-Modified', lastMod);

  return new Response(req.method === 'HEAD' ? null : upstream.body, {
    status: 200,
    headers: headers
  });
}
