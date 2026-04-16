const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const { put } = require('@vercel/blob');
const processor = require('./processor');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * Two-Way Cloud Branding (Zero-Limit Architecture)
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

        // 1. Fetch Input Image (Buffer or Blob URL)
        if (req.files['image']) {
            imageBuffer = req.files['image'][0].buffer;
        } else if (imagePwaUrl) {
            const response = await axios.get(imagePwaUrl, { responseType: 'arraybuffer' });
            imageBuffer = Buffer.from(response.data);
        }

        if (!imageBuffer) {
            return res.status(400).json({ error: 'No image provided' });
        }

        // 2. Process High-Res Branding
        const processedBuffer = await processor.processImage(
            imageBuffer,
            logoFile ? logoFile.buffer : null,
            parsedLogoSettings,
            parsedWhatsappSettings
        );

        // 3. Upload Branded Result to Vercel Blob (Bypassing Vercel Response Limits)
        const timestamp = Date.now();
        const brandedBlob = await put(`results/branded_${timestamp}.png`, processedBuffer, {
            access: 'public',
            contentType: 'image/png'
        });

        // 4. Return the Cloud URL
        res.json({
            success: true,
            brandedUrl: brandedBlob.url,
            name: brandedBlob.pathname
        });

    } catch (error) {
        console.error('Two-Way Process error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = app;
