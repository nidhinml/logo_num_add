import express from 'express';
import cors from 'cors';
import { handleUpload } from '@vercel/blob/client';

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Vercel Blob Token Generator - ESM Version
 */
app.post('/api/blob-upload', async (req, res) => {
    try {
        const jsonResponse = await handleUpload({
            body: req.body,
            request: req,
            onBeforeGenerateToken: async (pathname) => {
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

export default app;
