import { put, list, del, presignUrl, issueSignedToken } from '@vercel/blob';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import crypto from 'crypto';

const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const BLOB_STORE_ID = process.env.BLOB_STORE_ID || '';
const API_SECRET_KEY = process.env.API_SECRET_KEY;

export const config = { api: { bodyParser: false } };

// ------------------------------------------------------------
// Date-suffix helpers
// ------------------------------------------------------------
function getDateSuffix(timestamp) {
  const d = new Date(Number(timestamp));
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}${String(d.getUTCHours()).padStart(2, '0')}${String(d.getUTCMinutes()).padStart(2, '0')}${String(d.getUTCSeconds()).padStart(2, '0')}`;
}

function appendDateSuffix(filename, timestamp) {
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex === -1) return `${filename}_${getDateSuffix(timestamp)}`;
  return `${filename.slice(0, dotIndex)}_${getDateSuffix(timestamp)}${filename.slice(dotIndex)}`;
}

// ------------------------------------------------------------
// Manual JSON body reader (needed for DELETE, because bodyParser is disabled)
// ------------------------------------------------------------
async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

// ------------------------------------------------------------
// lastModified resolver
//   1. metadata.lastModified  → set by normal POST uploads
//   2. _YYYYMMDDHHMMSS suffix → set by presign+PUT direct uploads
//   3. .../YYYY/MM/DD/ folder → legacy
//   4. blob.uploadedAt        → final fallback
// ------------------------------------------------------------
function resolveLastModified(blob) {
  if (blob.metadata?.lastModified) {
    return Number(blob.metadata.lastModified);
  }

  const filename = (blob.pathname || '').split('/').pop() || '';
  const baseName = filename.split('.')[0];
  const tokens   = baseName.split('_');
  const suffix   = tokens[tokens.length - 1];

  if (/^\d{14}$/.test(suffix)) {
    const year    = parseInt(suffix.slice(0, 4), 10);
    const month   = parseInt(suffix.slice(4, 6), 10);
    const day     = parseInt(suffix.slice(6, 8), 10);
    const hours   = parseInt(suffix.slice(8, 10), 10);
    const minutes = parseInt(suffix.slice(10, 12), 10);
    const seconds = parseInt(suffix.slice(12, 14), 10);

    if (!isNaN(year) && !isNaN(month) && !isNaN(day) &&
        !isNaN(hours) && !isNaN(minutes) && !isNaN(seconds) &&
        month >= 1 && month <= 12 && day >= 1 && day <= 31 &&
        hours >= 0 && hours <= 23 &&
        minutes >= 0 && minutes <= 59 &&
        seconds >= 0 && seconds <= 59) {
      return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds)).toISOString();
    }
  }

  const parts = (blob.pathname || '').split('/').filter(p => p.length > 0);
  if (parts.length >= 4) {
    const year  = parseInt(parts[parts.length - 4], 10);
    const month = parseInt(parts[parts.length - 3], 10);
    const day   = parseInt(parts[parts.length - 2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day) &&
        month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const parsed = new Date(year, month - 1, day).getTime();
      if (!isNaN(parsed)) return parsed;
    }
  }

  return blob.uploadedAt;
}

// ------------------------------------------------------------
// Main handler — routes by method
// ------------------------------------------------------------
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // ---------- AUTHENTICATION ----------
  const authHeader = req.headers.authorization || '';
  const clientKey = authHeader.replace('Bearer ', '');

  if (!clientKey || clientKey !== API_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
  }

  // ------------------------------------------------------------
  // POST — presign OR normal upload
  // ------------------------------------------------------------
  if (req.method === 'POST') {
    // ---- Presign branch ----
    if (req.query.action === 'presign') {
      const form = new IncomingForm();
      try {
        const { fields } = await new Promise((resolve, reject) => {
          form.parse(req, (err, fields) => {
            if (err) reject(err);
            else resolve({ fields });
          });
        });

        const filename     = fields.filename?.[0]     || fields.filename;
        const category     = fields.category?.[0]     || fields.category || 'others';
        const lastModified = fields.lastModified?.[0] || fields.lastModified || Date.now();

        if (!filename) {
          return res.status(400).json({ error: 'filename is required' });
        }

        const finalFilename = appendDateSuffix(filename, lastModified);
        const pathname      = `uploads/${category}/${finalFilename}`;

        const { clientSigningToken, delegationToken } = await issueSignedToken({
          token: BLOB_READ_WRITE_TOKEN,
          operations: ['put'],
        });

        const { presignedUrl } = await presignUrl(
          { clientSigningToken, delegationToken },
          {
            pathname,
            operation: 'put',
            validUntil: Date.now() + 15 * 60 * 1000,
            addRandomSuffix: false,
            allowOverwrite: true,
          }
        );

        return res.status(200).json({ presignedUrl });
      } catch (error) {
        console.error('Presign error:', error);
        return res.status(500).json({ error: error.message || 'Presign failed' });
      }
    }

    // ---- Normal upload ----
    const form = new IncomingForm();
    try {
      const { fields, files } = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve({ fields, files });
        });
      });

      let file = files.image;
      if (Array.isArray(file)) file = file[0];
      if (!file) throw new Error('No image file provided (field "image")');
      const lastModified = req.query.lastModified || fields.lastModified || Date.now();

      let folder = '';
      const customFolder = req.query.folder;
      const category = req.query.category;

      if (customFolder) {
        folder = customFolder + '/';
      } else if (category) {
        folder = `uploads/${category}/`;
      } else {
        folder = 'uploads/';
      }

      let filename = file.originalFilename || file.name || file.filename;
      if (!filename) {
        const ext = file.mimetype ? file.mimetype.split('/')[1] : 'png';
        filename = `${crypto.randomUUID()}.${ext}`;
      }

      // ★ NEW: append the same _YYYYMMDDHHMMSS suffix the presign path uses
      filename = appendDateSuffix(filename, lastModified);

      const pathname = folder + filename;

      const buffer = fs.readFileSync(file.filepath);
      const blob = await put(pathname, buffer, {
        access: 'public',
        contentType: file.mimetype || 'application/octet-stream',
        token: BLOB_READ_WRITE_TOKEN,
        addRandomSuffix: false,
        cacheControlMaxAge: 60,
        metadata: {
          lastModified: String(lastModified),
        },
      });

      return res.status(200).json(blob);
    } catch (error) {
      console.error('Upload error:', error);
      return res.status(500).json({ error: error.message || 'Upload failed' });
    }
  }

  // ------------------------------------------------------------
  // GET — list all blobs
  // ------------------------------------------------------------
  if (req.method === 'GET') {
    try {
      const result = await list({ token: BLOB_READ_WRITE_TOKEN });

      const blobsWithMeta = result.blobs.map(blob => ({
        ...blob,
        lastModified: resolveLastModified(blob),
      }));

      return res.status(200).json({
        blobs: blobsWithMeta,
        storeId: BLOB_STORE_ID,
      });
    } catch (error) {
      console.error('List error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ------------------------------------------------------------
  // DELETE — remove a blob
  // ------------------------------------------------------------
  if (req.method === 'DELETE') {
    try {
      let pathname = req.query.pathname;
      if (!pathname) {
        const body = await readJsonBody(req);
        pathname = body.pathname;
      }
      if (!pathname) {
        return res.status(400).json({ error: 'Missing pathname' });
      }

      await del(pathname, { token: BLOB_READ_WRITE_TOKEN });
      return res.status(200).json({ success: true, pathname });
    } catch (error) {
      console.error('Delete error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'OPTIONS']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
