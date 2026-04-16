import React from 'react';
import { Download, ExternalLink, CheckCircle } from 'lucide-react';

const ImagePreview = ({ image, logo, logoSettings, whatsappSettings, processed }) => {
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

  const getLogoSize = (size) => {
    switch (size) {
      case 'small': return '10%';
      case 'medium': return '20%';
      case 'large': return '30%';
      default: return '20%';
    }
  };

  return (
    <div className="flex flex-col gap-3 group">
      <div className="relative aspect-video bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 shadow-xl">
        <img src={image.url} alt={image.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />

        {!processed && logo && (
          <div 
            className="absolute transition-all duration-300 pointer-events-none"
            style={{ 
              ...getPositionStyles(logoSettings.position),
              width: getLogoSize(logoSettings.size),
              opacity: logoSettings.opacity
            }}
          >
            <img src={logo.url} alt="Logo Overlay" className="w-full h-auto drop-shadow-lg" />
          </div>
        )}

        {!processed && whatsappSettings.enabled && (
          <div 
            className="absolute transition-all duration-300 pointer-events-none bg-black/30 backdrop-blur-[2px] px-3 py-1.5 rounded-full flex items-center gap-2"
            style={{ 
              ...getPositionStyles(whatsappSettings.position),
              color: whatsappSettings.color,
              fontSize: `${whatsappSettings.fontSize / 2}px` 
            }}
          >
            {whatsappSettings.showIcon && (
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <path d="M12.031 6.13c-2.39 0-4.33 1.944-4.33 4.335 0 .765.2 1.514.581 2.172L7.691 14.81l2.256-.591c.637.346 1.354.529 2.085.529 2.39 0 4.33-1.944 4.33-4.335 0-2.391-1.94-4.335-4.33-4.335zm3.123 6.17c-.129.363-.746.663-1.031.706-.285.043-.654.077-1.047-.048-.246-.081-.564-.19-.964-.356-1.707-.706-2.812-2.441-2.897-2.555-.084-.114-.638-.849-.638-1.62 0-.77.404-1.15.548-1.306.144-.156.314-.192.418-.192l.301.004c.11 0 .257-.04.403.315.146.356.5 1.223.543 1.314.043.09.071.196.012.314-.06.118-.09.192-.179.296-.089.105-.187.234-.266.313-.089.09-.182.188-.078.368.104.18.459.758.985 1.23.676.605 1.243.792 1.423.882.18.089.285.074.39-.044.105-.118.448-.523.568-.702.12-.178.24-.15.404-.09.164.06 1.037.49 1.216.58.179.089.299.134.343.209.043.076.043.438-.086.802z"/>
              </svg>
            )}
            {whatsappSettings.showNumber && <span className="font-bold tracking-wide whitespace-nowrap">{whatsappSettings.number || 'Your Number'}</span>}
          </div>
        )}

        {processed && (
          <div className="absolute inset-0 bg-primary-950/40 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-500">
            <CheckCircle className="w-12 h-12 text-primary-400 mb-2" />
            <span className="text-sm font-bold uppercase tracking-widest text-primary-200">Branded Successfully</span>
          </div>
        )}
      </div>
      
      <div className="px-2 flex justify-between items-center">
        <span className="text-xs font-medium text-slate-400 truncate max-w-[200px]">{image.name}</span>
      </div>
    </div>
  );
};

export default ImagePreview;
