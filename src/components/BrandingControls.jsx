import React from 'react';
import { Type, Move, Layers, Smartphone, Hash, Trash2, Scissors, Maximize } from 'lucide-react';

const BrandingControls = ({ logoSettings, setLogoSettings, whatsappSettings, setWhatsappSettings }) => {
  const positions = [
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-right', label: 'Bottom Right' },
    { value: 'bottom-center', label: 'Bottom Center' },
    { value: 'center', label: 'Center' },
  ];

  const sizes = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
  ];

  const fonts = [
    { value: 'modern', label: 'Modern Sans' },
    { value: 'elegant', label: 'Elegant Serif' },
    { value: 'monospace', label: 'Technical Mono' },
  ];

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary-400">
          <Layers className="w-4 h-4" />
          <h3 className="font-medium text-sm">Logo Settings</h3>
        </div>
        
        <div className="space-y-4 p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Scissors className="w-3 h-3" /> Remove Background
            </div>
            <button 
              onClick={() => setLogoSettings({...logoSettings, removeBackground: !logoSettings.removeBackground})}
              className={`w-8 h-4 rounded-full transition-all relative ${logoSettings.removeBackground ? 'bg-primary-500' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${logoSettings.removeBackground ? 'left-4.5' : 'left-0.5'}`}></div>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Maximize className="w-3 h-3" /> Original Size
            </div>
            <button 
              onClick={() => setLogoSettings({...logoSettings, useOriginalSize: !logoSettings.useOriginalSize})}
              className={`w-8 h-4 rounded-full transition-all relative ${logoSettings.useOriginalSize ? 'bg-primary-500' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${logoSettings.useOriginalSize ? 'left-4.5' : 'left-0.5'}`}></div>
            </button>
          </div>

          {!logoSettings.useOriginalSize && (
            <div className="space-y-3 pt-2">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider">Logo Scale</label>
              <div className="flex gap-2">
                {sizes.map(size => (
                  <button
                    key={size.value}
                    onClick={() => setLogoSettings({...logoSettings, size: size.value})}
                    className={`flex-1 py-1 text-[10px] rounded-md border transition-all ${
                      logoSettings.size === size.value 
                      ? 'bg-primary-500/20 border-primary-500 text-primary-400' 
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-[10px] text-slate-500 uppercase tracking-wider block">Position</label>
            <select 
              value={logoSettings.position}
              onChange={(e) => setLogoSettings({...logoSettings, position: e.target.value})}
              className="bg-slate-800 border-none rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary-500 outline-none w-full text-white appearance-none cursor-pointer"
            >
              {positions.map(pos => <option key={pos.value} value={pos.value}>{pos.label}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider">Opacity</label>
              <span className="text-[10px] text-primary-400 font-mono">{Math.round(logoSettings.opacity * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0.1" 
              max="1.0" 
              step="0.1"
              value={logoSettings.opacity}
              onChange={(e) => setLogoSettings({...logoSettings, opacity: parseFloat(e.target.value)})}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-400">
            <Smartphone className="w-4 h-4" />
            <h3 className="font-medium text-sm">WhatsApp Branding</h3>
          </div>
          <button 
            onClick={() => setWhatsappSettings({...whatsappSettings, enabled: !whatsappSettings.enabled})}
            className={`w-10 h-5 rounded-full transition-all relative ${whatsappSettings.enabled ? 'bg-green-500' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${whatsappSettings.enabled ? 'left-5.5' : 'left-0.5'}`}></div>
          </button>
        </div>

        {whatsappSettings.enabled && (
          <div className="space-y-4 p-4 bg-slate-900/50 rounded-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-300">
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider">WhatsApp Number</label>
              <div className="relative">
                <Hash className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-500" />
                <input 
                  type="text"
                  placeholder="e.g. +91 98765 43210"
                  value={whatsappSettings.number}
                  onChange={(e) => setWhatsappSettings({...whatsappSettings, number: e.target.value})}
                  className="bg-slate-800 border-none rounded-lg pl-8 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-green-500 outline-none w-full text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider">Position</label>
              <select 
                value={whatsappSettings.position}
                onChange={(e) => setWhatsappSettings({...whatsappSettings, position: e.target.value})}
                className="bg-slate-800 border-none rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-green-500 outline-none w-full text-white appearance-none"
              >
                {positions.map(pos => <option key={pos.value} value={pos.value}>{pos.label}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider">Font Style</label>
              <select 
                value={whatsappSettings.fontStyle}
                onChange={(e) => setWhatsappSettings({...whatsappSettings, fontStyle: e.target.value})}
                className="bg-slate-800 border-none rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-green-500 outline-none w-full text-white appearance-none"
              >
                {fonts.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 uppercase tracking-wider">Size</label>
                <input 
                  type="number"
                  value={whatsappSettings.fontSize}
                  onChange={(e) => setWhatsappSettings({...whatsappSettings, fontSize: parseInt(e.target.value)})}
                  className="bg-slate-800 border-none rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-green-500 outline-none w-full text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 uppercase tracking-wider">Color</label>
                <input 
                  type="color"
                  value={whatsappSettings.color}
                  onChange={(e) => setWhatsappSettings({...whatsappSettings, color: e.target.value})}
                  className="h-8 w-full bg-slate-800 border-none rounded-lg p-0.5 cursor-pointer ring-1 ring-slate-700"
                />
              </div>
            </div>

            <div className="flex gap-2">
               <button
                onClick={() => setWhatsappSettings({...whatsappSettings, showIcon: !whatsappSettings.showIcon})}
                className={`flex-1 py-1 text-[10px] rounded-md border transition-all ${
                  whatsappSettings.showIcon 
                  ? 'bg-green-500/20 border-green-500 text-green-400' 
                  : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}
              >
                Icon
              </button>
              <button
                onClick={() => setWhatsappSettings({...whatsappSettings, showNumber: !whatsappSettings.showNumber})}
                className={`flex-1 py-1 text-[10px] rounded-md border transition-all ${
                  whatsappSettings.showNumber 
                  ? 'bg-green-500/20 border-green-500 text-green-400' 
                  : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}
              >
                Number
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandingControls;
