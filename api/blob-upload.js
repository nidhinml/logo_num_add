const express = require('express');
const cors = require('cors');
const { handleUpload } = require('@vercel/blob/client');

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Vercel Blob Token Generator
 * This endpoint authorizes the client to upload files directly to Vercel Blob
 */
app.post('/api/blob-upload', async (req, res) => {
    try {
        const jsonResponse = await handleUpload({
            body: req.body,
            request: req,
            onBeforeGenerateToken: async (pathname) => {
                // Here you can add user validation if needed
                return {
                    allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
                    tokenPayload: JSON.stringify({
                        timestamp: Date.now()
                    }),
                };
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                console.log('Blob upload completed:', blob.url);
            },
        });

        res.json(jsonResponse);
    } catch (error) {
        console.error('Blob token error:', error);
        res.status(400).json({ error: error.message });
    }
});

module.exports = app;
