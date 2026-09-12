import { put, presignUrl, issueSignedToken } from '@vercel/blob';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import crypto from 'crypto';

const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const API_SECRET_KEY = process.env.API_SECRET_KEY;

export const config = { api: { bodyParser: false } };

// ---------- Date-suffix helpers (mirror new server) ----------
function getDateSuffix(timestamp) {
  const d = new Date(Number(timestamp));
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}${String(d.getUTCHours()).padStart(2, '0')}${String(d.getUTCMinutes()).padStart(2, '0')}${String(d.getUTCSeconds()).padStart(2, '0')}`;
}

function appendDateSuffix(filename, timestamp) {
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex === -1) return `${filename}_${getDateSuffix(timestamp)}`;
  return `${filename.slice(0, dotIndex)}_${getDateSuffix(timestamp)}${filename.slice(dotIndex)}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ---------- AUTHENTICATION CHECK ----------
  const authHeader = req.headers.authorization || '';
  const clientKey = authHeader.replace('Bearer ', '');

  if (!clientKey || clientKey !== API_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
  }

  // ---------- PRESIGN BRANCH (new) ----------
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

  // ---------- NORMAL UPLOAD (unchanged) ----------
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

    // ---- Determine folder ----
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

    // ---- Filename ----
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
