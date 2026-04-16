import express from 'express';
import cors from 'cors';
import multer from 'multer';
import archiver from 'jszip'; // Using JSZip instead for better compatibility if needed, or stick to standard
import processor from './processor.js';

const app = express();

// Increase payload limits for Vercel
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', runtime: 'ESM', memory: process.memoryUsage() });
});

/**
 * Legacy Batch Route (Likely to hit 4.5MB limit, kept for backward compatibility)
 */
app.post('/api/process-batch', upload.fields([
    { name: 'images', maxCount: 20 },
    { name: 'logo', maxCount: 1 }
]), async (req, res) => {
    try {
        const { logoSettings, whatsappSettings } = req.body;
        const parsedLogoSettings = JSON.parse(logoSettings || '{}');
        const parsedWhatsappSettings = JSON.parse(whatsappSettings || '{}');
        
        const logoFile = req.files['logo'] ? req.files['logo'][0] : null;
        const images = req.files['images'] || [];

        if (images.length === 0) {
            return res.status(400).json({ error: 'No images provided' });
        }

        // Return first one as test for now, or just warn that single is preferred
        res.status(400).json({ error: 'Please use /api/process-single for large high-res images to avoid Vercel limits.' });
    } catch (error) {
        console.error('Batch error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default app;
