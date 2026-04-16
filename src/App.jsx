import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, CheckCircle, Download, Trash2, Smartphone, Monitor, RefreshCw, Share2 } from 'lucide-react';
import axios from 'axios';
import BrandingControls from './components/BrandingControls';
import ImagePreview from './components/ImagePreview';
import Uploader from './components/Uploader';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

function App() {
  const [images, setImages] = useState([]); 
  const [logo, setLogo] = useState(null); 
  const [logoSettings, setLogoSettings] = useState({
    size: 'medium',
    position: 'bottom-right',
    opacity: 1,
    offset: { x: 20, y: 20 },
    removeBackground: false,
    useOriginalSize: false
  });
  const [whatsappSettings, setWhatsappSettings] = useState({
    enabled: false,
    number: '',
    fontSize: 24,
    color: '#ffffff',
    position: 'bottom-left',
    offset: { x: 20, y: 20 },
    showIcon: true,
    showNumber: true,
    fontStyle: 'modern'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(!!navigator.share);
  }, []);

  const handleLocalUpload = (files) => {
    const newImages = files.map(file => ({
      file,
      name: file.name,
      url: URL.createObjectURL(file)
    }));
    setImages([...images, ...newImages]);
  };

  const handleLocalLogoUpload = (file) => {
    if (logo) URL.revokeObjectURL(logo.url);
    setLogo({
      file,
      url: URL.createObjectURL(file)
    });
  };

  const handleProcess = async (mode = 'download') => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setDownloadUrl(null);

    const formData = new FormData();
    images.forEach(img => formData.append('images', img.file));
    if (logo) formData.append('logo', logo.file);
    
    formData.append('logoSettings', JSON.stringify(logoSettings));
    formData.append('whatsappSettings', JSON.stringify(whatsappSettings));

    try {
      const res = await axios.post(`${API_BASE}/process-batch`, formData, {
        responseType: 'blob'
      });
      
      const blob = new Blob([res.data], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      if (mode === 'share' && canShare) {
        // Native Share API for mobile (Saving to Photos)
        const file = new File([res.data], 'branded_images.zip', { type: 'application/zip' });
        try {
          await navigator.share({
            files: [file],
            title: 'Branded Images',
            text: 'Your branded images are ready!'
          });
        } catch (err) {
          console.log('Share failed or cancelled', err);
        }
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'branded_images.zip');
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

    } catch (err) {
      alert('Processing failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 bg-slate-950/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="bg-primary-500 p-2 rounded-lg">
            <ImageIcon className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">BrandFlow<span className="text-primary-500">AI</span></h1>
        </div>
        
        <div className="flex items-center gap-3">
          {canShare && (
             <button 
              onClick={() => handleProcess('share')}
              disabled={images.length === 0 || isProcessing}
              className="hidden md:flex bg-slate-800 hover:bg-slate-700 disabled:opacity-50 px-5 py-2 rounded-full font-medium transition-all items-center gap-2 border border-slate-700"
            >
              <Share2 className="w-4 h-4" /> Share to Phone
            </button>
          )}
          <button 
            onClick={() => handleProcess('download')}
            disabled={images.length === 0 || isProcessing}
            className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-full font-medium transition-all flex items-center gap-2 shadow-lg shadow-primary-600/20"
          >
            {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {isProcessing ? 'Baking...' : 'Brand All'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
        <aside className="w-full md:w-80 border-r border-slate-800 overflow-y-auto p-6 flex flex-col gap-8 bg-slate-950 z-40 shadow-2xl">
          <section>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Base Images</h2>
            <Uploader 
              onUpload={handleLocalUpload} 
              multiple={true} 
              label="Upload Images"
              icon={<Upload className="w-5 h-5" />}
            />
            {images.length > 0 && (
              <div className="mt-2 text-xs text-slate-500 flex justify-between items-center px-1">
                <span>{images.length} files selected</span>
                <button onClick={() => setImages([])} className="text-red-400 hover:text-red-300">Clear All</button>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Branding Logo</h2>
            {!logo ? (
              <Uploader 
                onUpload={(files) => handleLocalLogoUpload(files[0])} 
                multiple={false} 
                label="Upload Logo"
                icon={<ImageIcon className="w-5 h-5" />}
              />
            ) : (
              <div className="relative group rounded-xl border border-slate-700 p-2 bg-slate-900/50">
                <img src={logo.url} alt="Logo" className="max-h-20 mx-auto object-contain" />
                <button 
                  onClick={() => setLogo(null)}
                  className="absolute -top-2 -right-2 bg-red-500 p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform"
                >
                  <Trash2 className="w-3 h-3 text-white" />
                </button>
              </div>
            )}
          </section>

          <BrandingControls 
            logoSettings={logoSettings} 
            setLogoSettings={setLogoSettings}
            whatsappSettings={whatsappSettings}
            setWhatsappSettings={setWhatsappSettings}
          />
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 bg-slate-950">
          {images.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4 opacity-60">
              <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center border-2 border-slate-800 border-dashed animate-pulse">
                <Upload className="w-10 h-10" />
              </div>
              <p className="text-xl font-medium">Ready for your content</p>
              <p className="text-sm">Upload images to see live branding preview</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-20">
              {images.map((img, idx) => (
                <ImagePreview 
                  key={idx}
                  image={img}
                  logo={logo}
                  logoSettings={logoSettings}
                  whatsappSettings={whatsappSettings}
                  processed={null}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {canShare && images.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] md:hidden">
          <button 
            onClick={() => handleProcess('share')}
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-full font-bold shadow-2xl flex items-center gap-3 animate-in fade-in zoom-in slide-in-from-bottom-10"
          >
            {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
            Save All to Photos
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
