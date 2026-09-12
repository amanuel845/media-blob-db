import { list, del } from '@vercel/blob';

const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const BLOB_STORE_ID = process.env.BLOB_STORE_ID || '';
const API_SECRET_KEY = process.env.API_SECRET_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ---------- AUTHENTICATION ----------
  const authHeader = req.headers.authorization || '';
  const clientKey = authHeader.replace('Bearer ', '');

  if (!clientKey || clientKey !== API_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
  }

  // ---------- GET: List all blobs ----------
  if (req.method === 'GET') {
    try {
      const result = await list({ token: BLOB_READ_WRITE_TOKEN });

      // Map each blob to add a `lastModified` field
      const blobsWithMeta = result.blobs.map(blob => {
        let lastModified = blob.uploadedAt; // fallback: server upload time

        // 1. Prefer stored metadata (for new uploads)
        if (blob.metadata?.lastModified) {
          lastModified = Number(blob.metadata.lastModified);
        } else {
          // 2. Try to parse date from folder structure for old uploads
          //    Expected path: .../YYYY/MM/DD/filename.ext
          const parts = blob.pathname.split('/').filter(p => p.length > 0);
          if (parts.length >= 4) {
            const year = parseInt(parts[parts.length - 4], 10);
            const month = parseInt(parts[parts.length - 3], 10);
            const day = parseInt(parts[parts.length - 2], 10);
            // Validate numbers are within plausible ranges
            if (!isNaN(year) && !isNaN(month) && !isNaN(day) &&
                month >= 1 && month <= 12 && day >= 1 && day <= 31) {
              const parsed = new Date(year, month - 1, day).getTime();
              if (!isNaN(parsed)) {
                lastModified = parsed;
              }
            }
          }
        }

        return {
          ...blob,          // keep all original fields (url, pathname, size, uploadedAt, metadata, etc.)
          lastModified,     // add our computed field
        };
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

  // ---------- DELETE: Remove a blob ----------
  if (req.method === 'DELETE') {
    try {
      const { pathname } = req.body;
      if (!pathname) {
        return res.status(400).json({ error: 'Missing pathname in request body' });
      }
      await del(pathname, { token: BLOB_READ_WRITE_TOKEN });
      return res.status(200).json({ success: true, pathname });
    } catch (error) {
      console.error('Delete error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  res.setHeader('Allow', ['GET', 'DELETE', 'OPTIONS']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
