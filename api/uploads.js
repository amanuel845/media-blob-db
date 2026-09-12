import { put } from '@vercel/blob';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import crypto from 'crypto';

const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const API_SECRET_KEY = process.env.API_SECRET_KEY; // New secret key

export const config = { api: { bodyParser: false } };

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
