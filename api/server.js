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
  // POST — presign OR normal upload (formidable)
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
      const pathname = folder + filename;

      const buffer = fs.readFileSync(file.filepath);
      const blob = await put(pathname, buffer, {
        access: 'public',
        contentType: file.mimetype || 'application/octet-stream',
        token: BLOB_READ_WRITE_TOKEN,
        addRandomSuffix: false,
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

      const blobsWithMeta = result.blobs.map(blob => {
        let lastModified = blob.uploadedAt;

        if (blob.metadata?.lastModified) {
          lastModified = Number(blob.metadata.lastModified);
        } else {
          const parts = blob.pathname.split('/').filter(p => p.length > 0);
          if (parts.length >= 4) {
            const year = parseInt(parts[parts.length - 4], 10);
            const month = parseInt(parts[parts.length - 3], 10);
            const day = parseInt(parts[parts.length - 2], 10);
            if (!isNaN(year) && !isNaN(month) && !isNaN(day) &&
                month >= 1 && month <= 12 && day >= 1 && day <= 31) {
              const parsed = new Date(year, month - 1, day).getTime();
              if (!isNaN(parsed)) lastModified = parsed;
            }
          }
        }

        return { ...blob, lastModified };
      });

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
  // bodyParser is off globally, so we read the JSON body manually
  // ------------------------------------------------------------
  if (req.method === 'DELETE') {
    try {
      // Accept pathname from either the JSON body (client default) or query string
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
