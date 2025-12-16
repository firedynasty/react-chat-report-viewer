// Vercel Serverless Function for File Storage (Vercel Blob)
// Environment variables (set in Vercel dashboard):
// - BLOB_READ_WRITE_TOKEN: Vercel Blob storage token
// - ACCESS_CODE: Password users must enter to access files

import { put, list, del } from '@vercel/blob';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Validate access code for all requests
  const accessCode = req.method === 'GET'
    ? req.query.accessCode
    : req.body?.accessCode;

  const validAccessCode = process.env.ACCESS_CODE;
  if (!accessCode || accessCode !== validAccessCode) {
    return res.status(401).json({ error: 'Invalid or missing access code' });
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    return res.status(500).json({ error: 'Blob storage not configured' });
  }

  try {
    if (req.method === 'GET') {
      // GET: Fetch file content
      const { filename } = req.query;

      if (!filename) {
        return res.status(400).json({ error: 'Filename is required' });
      }

      const blobKey = `docs/${filename}`;

      // List blobs to find the file
      const { blobs } = await list({
        prefix: blobKey,
        token: blobToken,
      });

      const fileBlob = blobs.find(b => b.pathname === blobKey);

      if (!fileBlob) {
        return res.status(200).json({
          exists: false,
          filename: filename,
          content: null,
        });
      }

      // Fetch the content
      const response = await fetch(fileBlob.url);
      const content = await response.text();

      return res.status(200).json({
        exists: true,
        filename: filename,
        blobKey: blobKey,
        content: content,
        contentLength: content.length,
        url: fileBlob.url,
        fetchEndpoint: '/api/files',
        saveEndpoint: '/api/files',
        saveRequestBody: {
          filename: filename,
          content: '<your_content_here>',
          accessCode: '<your_access_code>'
        },
        appendExample: {
          filename: filename,
          content: content + '\n<appended_content>',
          accessCode: '<your_access_code>'
        }
      });

    } else if (req.method === 'POST') {
      // POST: Save/update file content
      const { filename, content } = req.body;

      if (!filename) {
        return res.status(400).json({ error: 'Filename is required' });
      }

      if (content === undefined || content === null) {
        return res.status(400).json({ error: 'Content is required' });
      }

      const blobKey = `docs/${filename}`;

      // Check if file exists and delete it first (to overwrite)
      const { blobs } = await list({
        prefix: blobKey,
        token: blobToken,
      });

      const existingBlob = blobs.find(b => b.pathname === blobKey);
      if (existingBlob) {
        await del(existingBlob.url, { token: blobToken });
      }

      // Upload new content
      const blob = await put(blobKey, content, {
        access: 'public',
        token: blobToken,
        addRandomSuffix: false,
      });

      return res.status(200).json({
        success: true,
        filename: filename,
        blobKey: blobKey,
        url: blob.url,
        contentLength: content.length,
        message: existingBlob ? 'File updated successfully' : 'File created successfully'
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Blob storage error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to access blob storage',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
