import sharp from 'sharp';

// Disable Sharp cache and limit concurrency to minimize memory usage in Vercel functions
sharp.cache(false);
sharp.concurrency(1);

/**
 * Main processor for branding images (Stateless / Buffer-based)
 * Refactored to ES Modules
 */
class ImageProcessor {
    /**
     * Applies branding to an image buffer
     */
    async processImage(inputBuffer, logoBuffer, logoSettings, whatsappSettings) {
        try {
            const image = sharp(inputBuffer);
            const metadata = await image.metadata();
            const compositeLayers = [];

            // 1. Process Logo Layer
            let finalLogoMetadata = null;
            let logoPos = null;

            if (logoBuffer && logoSettings) {
                const logoLayer = await this.prepareLogoLayer(logoBuffer, logoSettings, metadata);
                compositeLayers.push(logoLayer);
                finalLogoMetadata = logoLayer.metadata;
                logoPos = { top: logoLayer.top, left: logoLayer.left };
            }

            // 2. Process WhatsApp Layer
            if (whatsappSettings && whatsappSettings.enabled) {
                const whatsappLayer = await this.prepareWhatsAppLayer(whatsappSettings, metadata, logoPos, finalLogoMetadata);
                compositeLayers.push(whatsappLayer);
            }

            // 3. Composite and Return Buffer
            return await image
                .composite(compositeLayers)
                .withMetadata()
                .toFormat(metadata.format || 'png', { quality: 100 })
                .toBuffer();
        } catch (error) {
            console.error('Error processing image:', error);
            throw error;
        }
    }

    /**
     * Prepares the logo layer for composition
     */
    async prepareLogoLayer(buffer, settings, imgMetadata) {
        const { size, position, opacity, offset, removeBackground, useOriginalSize } = settings;
        let logo = sharp(buffer);

        // 1. Transparent Background Logic (Smart Alpha)
        if (removeBackground) {
            logo = logo.ensureAlpha()
                .composite([{
                    input: await sharp(buffer)
                        .greyscale()
                        .negate()
                        .threshold(10)
                        .toBuffer(),
                    blend: 'dest-in'
                }]);
        }

        // 2. Calculate size
        if (!useOriginalSize) {
            let scale = 0.2;
            if (size === 'small') scale = 0.1;
            if (size === 'large') scale = 0.3;
            if (typeof size === 'number') scale = size / 100;
            const targetWidth = Math.min(Math.round(imgMetadata.width * scale), imgMetadata.width);
            logo = logo.resize({ width: targetWidth, height: imgMetadata.height, fit: 'inside' });
        }

        if (opacity < 1) {
            logo = logo.ensureAlpha(opacity);
        }

        const processedLogoBuffer = await logo.toBuffer();
        const logoMetadata = await sharp(processedLogoBuffer).metadata();

        const pos = this.calculatePosition(
            imgMetadata.width,
            imgMetadata.height,
            logoMetadata.width,
            logoMetadata.height,
            position,
            offset || { x: 20, y: 20 }
        );

        return {
            input: processedLogoBuffer,
            top: pos.top,
            left: pos.left,
            metadata: logoMetadata
        };
    }

    /**
     * Prepares the WhatsApp layer for composition
     */
    async prepareWhatsAppLayer(settings, imgMetadata, logoPos, logoMetadata) {
        const { number, fontSize, color, position, offset, showIcon, showNumber, fontStyle } = settings;
        
        const actualFontSize = fontSize || Math.round(imgMetadata.width * 0.02) || 24;
        const iconSize = Math.round(actualFontSize * 1.2);
        const textColor = color || 'white';
        
        let fontFamily = 'Arial, sans-serif';
        let fontWeight = 'bold';
        if (fontStyle === 'elegant') {
            fontFamily = 'Georgia, serif';
            fontWeight = 'normal';
        } else if (fontStyle === 'modern') {
            fontFamily = 'Verdana, sans-serif';
            fontWeight = 'bold';
        } else if (fontStyle === 'monospace') {
            fontFamily = 'Courier New, monospace';
            fontWeight = 'normal';
        }

        const waIconPath = "M12.031 6.13c-2.39 0-4.33 1.944-4.33 4.335 0 .765.2 1.514.581 2.172L7.691 14.81l2.256-.591c.637.346 1.354.529 2.085.529 2.39 0 4.33-1.944 4.33-4.335 0-2.391-1.94-4.335-4.33-4.335zm3.123 6.17c-.129.363-.746.663-1.031.706-.285.043-.654.077-1.047-.048-.246-.081-.564-.19-.964-.356-1.707-.706-2.812-2.441-2.897-2.555-.084-.114-.638-.849-.638-1.62 0-.77.404-1.15.548-1.306.144-.156.314-.192.418-.192l.301.004c.11 0 .257-.04.403.315.146.356.5 1.223.543 1.314.043.09.071.196.012.314-.06.118-.09.192-.179.296-.089.105-.187.234-.266.313-.089.09-.182.188-.078.368.104.18.459.758.985 1.23.676.605 1.243.792 1.423.882.18.089.285.074.39-.044.105-.118.448-.523.568-.702.12-.178.24-.15.404-.09.164.06 1.037.49 1.216.58.179.089.299.134.343.209.043.076.043.438-.086.802z";
        
        let svgContent = `<svg width="${imgMetadata.width}" height="${actualFontSize * 2}" xmlns="http://www.w3.org/2000/svg">`;
        let xOffset = 0;
        
        if (showIcon) {
            svgContent += `<path d="${waIconPath}" fill="${textColor}" transform="scale(${iconSize/24})"/>`;
            xOffset += iconSize + 10;
        }
        
        if (showNumber) {
            svgContent += `<text x="${xOffset}" y="${actualFontSize * 1.2}" font-family="${fontFamily}" font-size="${actualFontSize}" fill="${textColor}" font-weight="${fontWeight}">${number}</text>`;
        }
        
        svgContent += `</svg>`;

        const whatsappBuffer = await sharp(Buffer.from(svgContent)).toBuffer();
        const waMetadata = await sharp(whatsappBuffer).metadata();

        let pos = this.calculatePosition(
            imgMetadata.width,
            imgMetadata.height,
            waMetadata.width,
            waMetadata.height,
            position,
            offset || { x: 20, y: 20 }
        );

        if (logoPos && position === logoSettings?.position) {
            const gap = 15;
            pos.top = logoPos.top - waMetadata.height - gap;
            if (pos.top < 0) {
                pos.top = logoPos.top + logoMetadata.height + gap;
            }
        }

        return {
            input: whatsappBuffer,
            top: pos.top,
            left: pos.left
        };
    }

    /**
     * Helper to calculate coordinate position
     */
    calculatePosition(imgW, imgH, layerW, layerH, type, offset) {
        let top = 0;
        let left = 0;

        switch (type) {
            case 'top-left':
                top = offset.y;
                left = offset.x;
                break;
            case 'top-right':
                top = offset.y;
                left = imgW - layerW - offset.x;
                break;
            case 'bottom-left':
                top = imgH - layerH - offset.y;
                left = offset.x;
                break;
            case 'bottom-right':
                top = imgH - layerH - offset.y;
                left = imgW - layerW - offset.x;
                break;
            case 'bottom-center':
                top = imgH - layerH - offset.y;
                left = (imgW - layerW) / 2;
                break;
            case 'center':
                top = (imgH - layerH) / 2;
                left = (imgW - layerW) / 2;
                break;
            default:
                top = imgH - layerH - offset.y;
                left = imgW - layerW - offset.x;
        }

        top = Math.max(0, Math.min(top, imgH - layerH));
        left = Math.max(0, Math.min(left, imgW - layerW));

        return { top: Math.round(top), left: Math.round(left) };
    }
}

export default new ImageProcessor();
