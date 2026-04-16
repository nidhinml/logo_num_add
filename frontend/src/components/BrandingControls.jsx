import React from 'react';
import { Type, Move, Layers, Smartphone, Hash } from 'lucide-react';

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
    { value: 'small', label: 'Small (10%)' },
    { value: 'medium', label: 'Medium (20%)' },
    { value: 'large', label: 'Large (30%)' },
  ];

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Logo Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary-400">
          <Layers className="w-4 h-4" />
          <h3 className="font-medium">Logo Settings</h3>
        </div>
        
        <div className="space-y-3">
          <label className="text-xs text-slate-400 block uppercase tracking-wider">Position</label>
          <div className="grid grid-cols-1 gap-2">
            <select 
              value={logoSettings.position}
              onChange={(e) => setLogoSettings({...logoSettings, position: e.target.value})}
              className="bg-slate-800 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none w-full"
            >
              {positions.map(pos => <option key={pos.value} value={pos.value}>{pos.label}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">Size</label>
          <div className="flex gap-2">
            {sizes.map(size => (
              <button
                key={size.value}
                onClick={() => setLogoSettings({...logoSettings, size: size.value})}
                className={`flex-1 py-1.5 text-[10px] rounded-md border transition-all ${
                  logoSettings.size === size.value 
                  ? 'bg-primary-500/20 border-primary-500 text-primary-400' 
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                {size.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <label className="text-xs text-slate-400 uppercase tracking-wider">Opacity</label>
            <span className="text-xs text-primary-400 font-mono">{Math.round(logoSettings.opacity * 100)}%</span>
          </div>
          <input 
            type="range" 
            min="0.1" 
            max="1.0" 
            step="0.1"
            value={logoSettings.opacity}
            onChange={(e) => setLogoSettings({...logoSettings, opacity: parseFloat(e.target.value)})}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
          />
        </div>
      </div>

      <div className="h-px bg-slate-800"></div>

      {/* WhatsApp Settings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-400">
            <Smartphone className="w-4 h-4" />
            <h3 className="font-medium">WhatsApp Branding</h3>
          </div>
          <button 
            onClick={() => setWhatsappSettings({...whatsappSettings, enabled: !whatsappSettings.enabled})}
            className={`w-10 h-5 rounded-full transition-all relative ${whatsappSettings.enabled ? 'bg-green-500' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${whatsappSettings.enabled ? 'left-6' : 'left-1'}`}></div>
          </button>
        </div>

        {whatsappSettings.enabled && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              <label className="text-xs text-slate-400 uppercase tracking-wider">Number</label>
              <div className="relative">
                <Hash className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input 
                  type="text"
                  placeholder="e.g. +91 98765 43210"
                  value={whatsappSettings.number}
                  onChange={(e) => setWhatsappSettings({...whatsappSettings, number: e.target.value})}
                  className="bg-slate-800 border-none rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none w-full placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs text-slate-400 uppercase tracking-wider">Position</label>
              <select 
                value={whatsappSettings.position}
                onChange={(e) => setWhatsappSettings({...whatsappSettings, position: e.target.value})}
                className="bg-slate-800 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none w-full"
              >
                {positions.map(pos => <option key={pos.value} value={pos.value}>{pos.label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-slate-400 uppercase tracking-wider">Font Size</label>
                <input 
                  type="number"
                  value={whatsappSettings.fontSize}
                  onChange={(e) => setWhatsappSettings({...whatsappSettings, fontSize: parseInt(e.target.value)})}
                  className="bg-slate-800 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-400 uppercase tracking-wider">Color</label>
                <input 
                  type="color"
                  value={whatsappSettings.color}
                  onChange={(e) => setWhatsappSettings({...whatsappSettings, color: e.target.value})}
                  className="h-9 w-full bg-slate-800 border-none rounded-lg p-1 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-2">
               <button
                onClick={() => setWhatsappSettings({...whatsappSettings, showIcon: !whatsappSettings.showIcon})}
                className={`flex-1 py-1.5 text-[10px] rounded-md border transition-all ${
                  whatsappSettings.showIcon 
                  ? 'bg-green-500/20 border-green-500 text-green-400' 
                  : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                Icon
              </button>
              <button
                onClick={() => setWhatsappSettings({...whatsappSettings, showNumber: !whatsappSettings.showNumber})}
                className={`flex-1 py-1.5 text-[10px] rounded-md border transition-all ${
                  whatsappSettings.showNumber 
                  ? 'bg-green-500/20 border-green-500 text-green-400' 
                  : 'bg-slate-800 border-slate-700 text-slate-400'
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
