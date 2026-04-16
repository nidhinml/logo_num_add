const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const processor = require('./processor');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * Handle Single Image Processing
 * Supports both File Upload (Buffer) AND Blob URL
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

        // Option A: Direct upload (Subject to 4.5MB limit)
        if (req.files['image']) {
            imageBuffer = req.files['image'][0].buffer;
        } 
        // Option B: Vercel Blob URL (Supports huge images)
        else if (imagePwaUrl) {
            const response = await axios.get(imagePwaUrl, { responseType: 'arraybuffer' });
            imageBuffer = Buffer.from(response.data);
        }

        if (!imageBuffer) {
            return res.status(400).json({ error: 'No image provided' });
        }

        const processedBuffer = await processor.processImage(
            imageBuffer,
            logoFile ? logoFile.buffer : null,
            parsedLogoSettings,
            parsedWhatsappSettings
        );

        res.set('Content-Type', 'image/png');
        res.send(processedBuffer);
    } catch (error) {
        console.error('Process error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = app;
