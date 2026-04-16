import React from 'react';
import { Download, ExternalLink, CheckCircle, Share2, Smartphone } from 'lucide-react';

const ImagePreview = ({ image, logo, logoSettings, whatsappSettings, processed, onSave }) => {
  const getPositionStyles = (pos) => {
    switch (pos) {
      case 'top-left': return { top: '5%', left: '5%' };
      case 'top-right': return { top: '5%', right: '5%' };
      case 'bottom-left': return { bottom: '5%', left: '5%' };
      case 'bottom-right': return { bottom: '5%', right: '5%' };
      case 'bottom-center': return { bottom: '5%', left: '50%', transform: 'translateX(-50%)' };
      case 'center': return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
      default: return { bottom: '5%', right: '5%' };
    }
  };

  const getLogoSize = (settings) => {
    if (settings.useOriginalSize) return 'auto';
    switch (settings.size) {
      case 'small': return '10%';
      case 'medium': return '20%';
      case 'large': return '30%';
      default: return '20%';
    }
  };

  const getWAFont = (style) => {
    switch (style) {
      case 'elegant': return 'serif';
      case 'monospace': return 'monospace';
      default: return 'sans-serif';
    }
  };

  return (
    <div className="flex flex-col gap-3 group">
      <div className="relative aspect-video bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl transition-all duration-300 hover:border-primary-500/50">
        <img src={image.url} alt={image.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />

        {!processed && logo && (
          <div 
            className="absolute transition-all duration-300 pointer-events-none drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
            style={{ 
              ...getPositionStyles(logoSettings.position),
              width: getLogoSize(logoSettings),
              opacity: logoSettings.opacity,
              filter: logoSettings.removeBackground ? 'contrast(1.2) brightness(1.1)' : 'none'
            }}
          >
            <img 
               src={logo.url} 
               alt="Logo Overlay" 
               className={`w-full h-auto ${logoSettings.removeBackground ? 'mix-blend-screen' : ''}`} 
            />
          </div>
        )}

        {!processed && whatsappSettings.enabled && (
          <div 
            className="absolute transition-all duration-300 pointer-events-none bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 border border-white/10 shadow-lg"
            style={{ 
              ...getPositionStyles(whatsappSettings.position),
              color: whatsappSettings.color,
              fontSize: `${whatsappSettings.fontSize / 2.5}px`,
              fontFamily: getWAFont(whatsappSettings.fontStyle)
            }}
          >
            {whatsappSettings.showIcon && (
              <svg viewBox="0 0 24 24" className="w-4 h-4 shadow-sm" fill="currentColor">
                <path d="M12.031 6.13c-2.39 0-4.33 1.944-4.33 4.335 0 .765.2 1.514.581 2.172L7.691 14.81l2.256-.591c.637.346 1.354.529 2.085.529 2.39 0 4.33-1.944 4.33-4.335 0-2.391-1.94-4.335-4.33-4.335zm3.123 6.17c-.129.363-.746.663-1.031.706-.285.043-.654.077-1.047-.048-.246-.081-.564-.19-.964-.356-1.707-.706-2.812-2.441-2.897-2.555-.084-.114-.638-.849-.638-1.62 0-.77.404-1.15.548-1.306.144-.156.314-.192.418-.192l.301.004c.11 0 .257-.04.403.315.146.356.5 1.223.543 1.314.043.09.071.196.012.314-.06.118-.09.192-.179.296-.089.105-.187.234-.266.313-.089.09-.182.188-.078.368.104.18.459.758.985 1.23.676.605 1.243.792 1.423.882.18.089.285.074.39-.044.105-.118.448-.523.568-.702.12-.178.24-.15.404-.09.164.06 1.037.49 1.216.58.179.089.299.134.343.209.043.076.043.438-.086.802z"/>
              </svg>
            )}
            {whatsappSettings.showNumber && (
              <span className={`tracking-wide whitespace-nowrap ${whatsappSettings.fontStyle === 'elegant' ? 'italic' : 'font-bold'}`}>
                {whatsappSettings.number || 'Your Number'}
              </span>
            )}
          </div>
        )}

        {processed && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mb-6 ring-4 ring-primary-500/30">
              <CheckCircle className="w-8 h-8 text-primary-400" />
            </div>
            
            <button 
              onClick={() => onSave(processed)}
              className="w-full bg-primary-600 hover:bg-primary-500 text-white py-3 rounded-2xl font-black text-sm shadow-xl shadow-primary-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 group/btn"
            >
              <Smartphone className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
              SAVE TO GALLERY
            </button>
            <p className="mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">Tap button then "Save Image"</p>
          </div>
        )}
      </div>
      
      <div className="px-2 flex justify-between items-center group-hover:translate-x-1 transition-transform">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter truncate max-w-[200px]">{image.name}</span>
        {processed && <span className="text-[10px] text-primary-500 font-bold">READY</span>}
      </div>
    </div>
  );
};

export default ImageProcessorPreview;
