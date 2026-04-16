const express = require('express');
const cors = require('cors');
const multer = require('multer');
const processor = require('./processor');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * Handle Single Image Processing (To bypass 4.5MB batch limits)
 */
app.post('/api/process-single', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'logo', maxCount: 1 }
]), async (req, res) => {
    try {
        const { logoSettings, whatsappSettings } = req.body;
        const parsedLogoSettings = JSON.parse(logoSettings || '{}');
        const parsedWhatsappSettings = JSON.parse(whatsappSettings || '{}');
        
        const imageFile = req.files['image'] ? req.files['image'][0] : null;
        const logoFile = req.files['logo'] ? req.files['logo'][0] : null;

        if (!imageFile) {
            return res.status(400).json({ error: 'No image provided' });
        }

        const processedBuffer = await processor.processImage(
            imageFile.buffer,
            logoFile ? logoFile.buffer : null,
            parsedLogoSettings,
            parsedWhatsappSettings
        );

        res.set('Content-Type', 'image/png');
        res.send(processedBuffer);
    } catch (error) {
        console.error('Single process error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = app;
