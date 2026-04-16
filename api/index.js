import express from 'express';
import cors from 'cors';
import multer from 'multer';
import axios from 'axios';
import { put } from '@vercel/blob';
import { handleUpload } from '@vercel/blob/client';
import processor from './processor.js';

const app = express();

/**
 * 🛠️ CONFIGURATION
 */
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * 🏥 HEALTH & DIAGNOSTICS
 * Checks if the server is alive and if cloud settings are correct
 */
app.get('/api/debug', async (req, res) => {
    const results = {
        status: 'Online',
        runtime: 'Vercel Serverless (ESM)',
        timestamp: new Date().toISOString(),
        env: {
            CLOUD_TOKEN_READY: !!process.env.BLOB_READ_WRITE_TOKEN,
        },
        memory: process.memoryUsage()
    };
    res.json(results);
});

/**
 * 🔑 BLOB TOKEN GENERATOR
 * Authorizes the frontend to upload directly to Vercel Blob
 */
app.post('/api/blob-upload', async (req, res) => {
    try {
        const jsonResponse = await handleUpload({
            body: req.body,
            request: req,
            onBeforeGenerateToken: async () => ({
                allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
                tokenPayload: JSON.stringify({ timestamp: Date.now() }),
            }),
            onUploadCompleted: async ({ blob }) => {
                console.log('Server: Upload success', blob.url);
            },
        });
        res.json(jsonResponse);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * 🖼️ SINGLE IMAGE BRANDING (TWO-WAY CLOUD)
 * The core engine of BrandFlow Pro
 */
app.post('/api/process-single', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'logo', maxCount: 1 }
]), async (req, res) => {
    try {
        const { logoSettings, whatsappSettings, imagePwaUrl } = req.body;
        const parsedLogoSettings = JSON.parse(logoSettings || '{}');
        const parsedWhatsappSettings = JSON.parse(whatsappSettings || '{}');
        
        const logoFile = req.files['logo'] ? req.files['logo'][0] : null;
        let imageBuffer = null;

        // 1. Resolve Input Image
        if (req.files['image']) {
            imageBuffer = req.files['image'][0].buffer;
        } else if (imagePwaUrl) {
            const response = await axios.get(imagePwaUrl, { responseType: 'arraybuffer' });
            imageBuffer = Buffer.from(response.data);
        }

        if (!imageBuffer) throw new Error('NO_IMAGE_SOURCE');

        // 2. Pro Branding Logic
        const processedBuffer = await processor.processImage(
            imageBuffer,
            logoFile ? logoFile.buffer : null,
            parsedLogoSettings,
            parsedWhatsappSettings
        );

        // 3. Output to Cloud Result (Bypass Gateway)
        const timestamp = Date.now();
        const brandedBlob = await put(`results/branded_${timestamp}.png`, processedBuffer, {
            access: 'public',
            contentType: 'image/png'
        });

        res.json({
            success: true,
            brandedUrl: brandedBlob.url
        });

    } catch (error) {
        console.error('Server Logic Error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            diagnostic: "Check Vercel Blob connection if result upload failed."
        });
    }
});

app.get('/api/health', (req, res) => res.send('BrandFlow API is Healthy'));

export default app;
