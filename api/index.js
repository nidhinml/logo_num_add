import express from 'express';
import cors from 'cors';
import multer from 'multer';
import axios from 'axios';
import sharp from 'sharp';
import { put } from '@vercel/blob';
import { handleUpload } from '@vercel/blob/client';

// Configure Sharp for serverless environment
sharp.cache(false);
sharp.concurrency(1);

const app = express();

/**
 * 🛠️ CONSOLIDATED BRANDING & AI ENGINE
 */
class ImageProcessor {
    // Current Branding Logic
    async processImage(inputBuffer, logoBuffer, logoSettings, whatsappSettings) {
        try {
            const image = sharp(inputBuffer);
            const metadata = await image.metadata();
            const compositeLayers = [];
            let logoPos = null;
            let finalLogoMetadata = null;

            if (logoBuffer && logoSettings) {
                const logoLayer = await this.prepareLogoLayer(logoBuffer, logoSettings, metadata);
                compositeLayers.push(logoLayer);
                finalLogoMetadata = logoLayer.metadata;
                logoPos = { top: logoLayer.top, left: logoLayer.left };
            }

            if (whatsappSettings && whatsappSettings.enabled) {
                const whatsappLayer = await this.prepareWhatsAppLayer(whatsappSettings, metadata, logoPos, finalLogoMetadata);
                compositeLayers.push(whatsappLayer);
            }

            return await image
                .composite(compositeLayers)
                .withMetadata()
                .toFormat(metadata.format || 'png', { quality: 100 })
                .toBuffer();
        } catch (error) { throw error; }
    }

    async prepareLogoLayer(buffer, settings, imgMetadata) {
        const { size, position, opacity, offset, removeBackground, useOriginalSize } = settings;
        let logo = sharp(buffer);
        if (removeBackground) {
            logo = logo.ensureAlpha().composite([{
                input: await sharp(buffer).greyscale().negate().threshold(10).toBuffer(),
                blend: 'dest-in'
            }]);
        }
        if (!useOriginalSize) {
            let scale = 0.2;
            if (size === 'small') scale = 0.1;
            if (size === 'large') scale = 0.3;
            if (typeof size === 'number') scale = size / 100;
            const targetWidth = Math.min(Math.round(imgMetadata.width * scale), imgMetadata.width);
            logo = logo.resize({ width: targetWidth, height: imgMetadata.height, fit: 'inside' });
        }
        if (opacity < 1) logo = logo.ensureAlpha(opacity);
        const processedLogoBuffer = await logo.toBuffer();
        const logoMetadata = await sharp(processedLogoBuffer).metadata();
        const pos = this.calculatePosition(imgMetadata.width, imgMetadata.height, logoMetadata.width, logoMetadata.height, position, offset || { x: 20, y: 20 });
        return { input: processedLogoBuffer, top: pos.top, left: pos.left, metadata: logoMetadata };
    }

    async prepareWhatsAppLayer(settings, imgMetadata, logoPos, logoMetadata) {
        const { number, fontSize, color, position, offset, showIcon, showNumber, fontStyle } = settings;
        const actualFontSize = fontSize || Math.round(imgMetadata.width * 0.02) || 24;
        const iconSize = Math.round(actualFontSize * 1.2);
        const textColor = color || 'white';
        let fontFamily = 'Arial, sans-serif';
        if (fontStyle === 'elegant') fontFamily = 'Georgia, serif';
        else if (fontStyle === 'modern') fontFamily = 'Verdana, sans-serif';
        const waIconPath = "M12.031 6.13c-2.39 0-4.33 1.944-4.33 4.335 0 .765.2 1.514.581 2.172L7.691 14.81l2.256-.591c.637.346 1.354.529 2.085.529 2.39 0 4.33-1.944 4.33-4.335 0-2.391-1.94-4.335-4.33-4.335zm3.123 6.17c-.129.363-.746.663-1.031.706-.285.043-.654.077-1.047-.048-.246-.081-.564-.19-.964-.356-1.707-.706-2.812-2.441-2.897-2.555-.084-.114-.638-.849-.638-1.62 0-.77.404-1.15.548-1.306.144-.156.314-.192.418-.192l.301.004c.11 0 .257-.04.403.315.146.356.5 1.223.543 1.314.043.09.071.196.012.314-.06.118-.09.192-.179.296-.089.105-.187.234-.266.313-.089.09-.182.188-.078.368.104.18.459.758.985 1.23.676.605 1.243.792 1.423.882.18.089.285.074.39-.044.105-.118.448-.523.568-.702.12-.178.24-.15.404-.09.164.06 1.037.49 1.216.58.179.089.299.134.343.209.043.076.043.438-.086.802z";
        let svgContent = `<svg width="${imgMetadata.width}" height="${actualFontSize * 2}" xmlns="http://www.w3.org/2000/svg">`;
        let xOffset = 0;
        if (showIcon) { svgContent += `<path d="${waIconPath}" fill="${textColor}" transform="scale(${iconSize/24})"/>`; xOffset += iconSize + 10; }
        if (showNumber) { svgContent += `<text x="${xOffset}" y="${actualFontSize * 1.2}" font-family="${fontFamily}" font-size="${actualFontSize}" fill="${textColor}" font-weight="bold">${number}</text>`; }
        svgContent += `</svg>`;
        const whatsappBuffer = await sharp(Buffer.from(svgContent)).toBuffer();
        const waMetadata = await sharp(whatsappBuffer).metadata();
        let pos = this.calculatePosition(imgMetadata.width, imgMetadata.height, waMetadata.width, waMetadata.height, position, offset || { x: 20, y: 20 });
        if (logoPos && position === logoSettings?.position) {
            const gap = 15;
            pos.top = logoPos.top - waMetadata.height - gap;
            if (pos.top < 0) pos.top = logoPos.top + logoMetadata.height + gap;
        }
        return { input: whatsappBuffer, top: pos.top, left: pos.left };
    }

    calculatePosition(imgW, imgH, layerW, layerH, type, offset) {
        let top = 0; let left = 0;
        switch (type) {
            case 'top-left': top = offset.y; left = offset.x; break;
            case 'top-right': top = offset.y; left = imgW - layerW - offset.x; break;
            case 'bottom-left': top = imgH - layerH - offset.y; left = offset.x; break;
            case 'bottom-right': top = imgH - layerH - offset.y; left = imgW - layerW - offset.x; break;
            case 'bottom-center': top = imgH - layerH - offset.y; left = (imgW - layerW) / 2; break;
            case 'center': top = (imgH - layerH) / 2; left = (imgW - layerW) / 2; break;
            default: top = imgH - layerH - offset.y; left = imgW - layerW - offset.x;
        }
        return { top: Math.round(Math.max(0, Math.min(top, imgH - layerH))), left: Math.round(Math.max(0, Math.min(left, imgW - layerW))) };
    }
}

const engine = new ImageProcessor();

/**
 * 🛠️ API SETUP
 */
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

const storage = multer.memoryStorage();
const upload = multer({ storage });

const HF_TOKEN = process.env.HF_TOKEN;

/**
 * 🤖 AI: BACKGROUND REMOVAL (RMBG-1.4)
 */
app.post('/api/ai/remove-bg', upload.single('image'), async (req, res) => {
    try {
        if (!HF_TOKEN) throw new Error('HF_TOKEN_MISSING');
        const imageBuffer = req.file ? req.file.buffer : null;
        if (!imageBuffer) throw new Error('NO_IMAGE_UPLOADED');

        const response = await axios({
            method: 'post',
            url: 'https://api-inference.huggingface.co/models/briaai/RMBG-1.4',
            headers: { Authorization: `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/octet-stream' },
            data: imageBuffer,
            responseType: 'arraybuffer'
        });

        const cloudUrl = await put(`ai/removed_${Date.now()}.png`, Buffer.from(response.data), { access: 'public', contentType: 'image/png' });
        res.json({ success: true, url: cloudUrl.url });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 🎨 AI: BACKGROUND GENERATION (Stable Diffusion XL)
 */
app.post('/api/ai/generate-bg', async (req, res) => {
    try {
        if (!HF_TOKEN) throw new Error('HF_TOKEN_MISSING');
        const { prompt } = req.body;
        if (!prompt) throw new Error('NO_PROMPT_PROVIDED');

        const response = await axios({
            method: 'post',
            url: 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
            headers: { Authorization: `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/json' },
            data: JSON.stringify({ inputs: `luxury product shot, ${prompt}, high resolution, 8k, photorealistic, professional lighting` }),
            responseType: 'arraybuffer'
        });

        const cloudUrl = await put(`ai/bg_${Date.now()}.png`, Buffer.from(response.data), { access: 'public', contentType: 'image/png' });
        res.json({ success: true, url: cloudUrl.url });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 🏗️ AI: COMPOSITION (Merge Foreground + AI Background)
 */
app.post('/api/ai/composite', async (req, res) => {
    try {
        const { foregroundUrl, backgroundUrl, settings } = req.body;
        const parsedSettings = settings ? JSON.parse(settings) : { scale: 0.6, yOffset: 100 };

        const [fgRes, bgRes] = await Promise.all([
            axios.get(foregroundUrl, { responseType: 'arraybuffer' }),
            axios.get(backgroundUrl, { responseType: 'arraybuffer' })
        ]);

        const fgBuffer = Buffer.from(fgRes.data);
        const bgBuffer = Buffer.from(bgRes.data);

        const bgMetadata = await sharp(bgBuffer).metadata();
        const fgResized = await sharp(fgBuffer)
            .resize({ width: Math.round(bgMetadata.width * (parsedSettings.scale || 0.6)) })
            .toBuffer();
        
        const fgMetadata = await sharp(fgResized).metadata();

        const resultBuffer = await sharp(bgBuffer)
            .composite([{
                input: fgResized,
                top: Math.round((bgMetadata.height - fgMetadata.height) / 2 + (parsedSettings.yOffset || 0)),
                left: Math.round((bgMetadata.width - fgMetadata.width) / 2)
            }])
            .toBuffer();

        const cloudUrl = await put(`ai/composition_${Date.now()}.png`, resultBuffer, { access: 'public', contentType: 'image/png' });
        res.json({ success: true, url: cloudUrl.url });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// STANDARDIZED API ROUTES (Existing)
app.get('/api/debug', (req, res) => res.json({ status: 'Online', aiEnabled: !!HF_TOKEN, timestamp: new Date().toISOString() }));
app.post('/api/blob-upload', async (req, res) => {
    try {
        const jsonResponse = await handleUpload({ body: req.body, request: req, onBeforeGenerateToken: async () => ({ allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'], tokenPayload: JSON.stringify({ timestamp: Date.now() }) }) });
        res.json(jsonResponse);
    } catch (error) { res.status(400).json({ error: error.message }); }
});

app.post('/api/process-single', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'logo', maxCount: 1 }]), async (req, res) => {
    try {
        const { logoSettings, whatsappSettings, imagePwaUrl } = req.body;
        const parsedLogoSettings = JSON.parse(logoSettings || '{}');
        const parsedWhatsappSettings = JSON.parse(whatsappSettings || '{}');
        const logoFile = req.files['logo'] ? req.files['logo'][0] : null;
        let imageBuffer = null;
        if (req.files['image']) imageBuffer = req.files['image'][0].buffer;
        else if (imagePwaUrl) imageBuffer = Buffer.from((await axios.get(imagePwaUrl, { responseType: 'arraybuffer' })).data);
        if (!imageBuffer) throw new Error('NO_IMAGE_SOURCE');
        const processedBuffer = await engine.processImage(imageBuffer, logoFile?.buffer, parsedLogoSettings, parsedWhatsappSettings);
        const brandedBlob = await put(`results/branded_${Date.now()}.png`, processedBuffer, { access: 'public', contentType: 'image/png' });
        res.json({ success: true, brandedUrl: brandedBlob.url });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/health', (req, res) => res.send('BrandFlow AI Engine Live'));
export default app;
