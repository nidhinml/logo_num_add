const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const archiver = require('archiver');
const processor = require('./processor');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Higher limit for multiple images

// Multer Memory Storage Configuration (Vercel-friendly)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB per file
});

/**
 * Health Check
 */
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

/**
 * All-in-one Process & Download (Stateless)
 * This endpoint takes images + logo + settings and returns a ZIP stream
 */
app.post('/api/process-batch', upload.fields([
    { name: 'images', maxCount: 20 },
    { name: 'logo', maxCount: 1 }
]), async (req, res) => {
    try {
        const { logoSettings, whatsappSettings } = req.body;
        const parsedLogoSettings = JSON.parse(logoSettings || '{}');
        const parsedWhatsappSettings = JSON.parse(whatsappSettings || '{}');
        
        const imageFiles = req.files['images'];
        const logoFile = req.files['logo'] ? req.files['logo'][0] : null;

        if (!imageFiles || imageFiles.length === 0) {
            return res.status(400).json({ error: 'No images provided' });
        }

        // Setup Zip Stream
        res.attachment('branded_images.zip');
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);

        // Process each image and add to ZIP
        for (const file of imageFiles) {
            const processedBuffer = await processor.processImage(
                file.buffer,
                logoFile ? logoFile.buffer : null,
                parsedLogoSettings,
                parsedWhatsappSettings
            );
            
            archive.append(processedBuffer, { name: file.originalname });
        }

        await archive.finalize();
    } catch (error) {
        console.error('Processing error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// For local dev compatibility (optional)
app.listen(PORT, () => {
    console.log(`Stateless server running on http://localhost:${PORT}`);
});

module.exports = app; // For Vercel
