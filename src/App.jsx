import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, CheckCircle, Download, Trash2, Smartphone, Monitor, RefreshCw, Share2, Loader2 } from 'lucide-react';
import axios from 'axios';
import JSZip from 'jszip';
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
  
  const [processingState, setProcessingState] = useState({
    isProcessing: false,
    currentStep: 0,
    totalSteps: 0,
    processedFiles: [] // { name: string, blob: Blob }
  });

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

  /**
   * Sequential Processing Flow (Bypasses Vercel 4.5MB limit)
   */
  const handleProcessSequential = async (mode = 'zip') => {
    if (images.length === 0) return;
    
    setProcessingState({
      isProcessing: true,
      currentStep: 0,
      totalSteps: images.length,
      processedFiles: []
    });

    const results = [];
    const zip = new JSZip();

    try {
      for (let i = 0; i < images.length; i++) {
        setProcessingState(prev => ({ ...prev, currentStep: i + 1 }));
        
        const img = images[i];
        const formData = new FormData();
        formData.append('image', img.file);
        if (logo) formData.append('logo', logo.file);
        formData.append('logoSettings', JSON.stringify(logoSettings));
        formData.append('whatsappSettings', JSON.stringify(whatsappSettings));

        const res = await axios.post(`${API_BASE}/process-single`, formData, {
          responseType: 'blob'
        });

        const processedBlob = new Blob([res.data], { type: 'image/png' });
        results.push({ name: img.name, blob: processedBlob });
        zip.file(img.name.replace(/\.[^/.]+$/, "") + "_branded.png", processedBlob);
      }

      if (mode === 'zip') {
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'branded_images.zip');
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else if (mode === 'share' && canShare) {
        // Prepare files for Native Share
        const shareFiles = results.map(r => new File([r.blob], r.name, { type: 'image/png' }));
        try {
          await navigator.share({
            files: shareFiles,
            title: 'Branded Images',
            text: 'Here are your branded images!'
          });
        } catch (err) {
          console.log('Share result:', err);
        }
      }

      setProcessingState(prev => ({ ...prev, processedFiles: results }));
    } catch (err) {
      alert('Processing failed: ' + (err.response?.status === 413 ? "File too large for Vercel (4.5MB limit)" : err.message));
    } finally {
      setProcessingState(prev => ({ ...prev, isProcessing: false }));
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
          <button 
            onClick={() => handleProcessSequential('zip')}
            disabled={images.length === 0 || processingState.isProcessing}
            className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-full font-medium transition-all flex items-center gap-2 shadow-lg shadow-primary-600/20"
          >
            {processingState.isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {processingState.isProcessing 
              ? `Processing ${processingState.currentStep}/${processingState.totalSteps}...` 
              : 'Download ZIP'
            }
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-24">
              {images.map((img, idx) => (
                <ImagePreview 
                  key={idx}
                  image={img}
                  logo={logo}
                  logoSettings={logoSettings}
                  whatsappSettings={whatsappSettings}
                  processed={processingState.processedFiles.find(f => f.name === img.name)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {images.length > 0 && canShare && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]">
          <button 
            onClick={() => handleProcessSequential('share')}
            disabled={processingState.isProcessing}
            className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-full font-bold shadow-2xl flex items-center gap-3 transition-all scale-100 hover:scale-105 active:scale-95"
          >
            {processingState.isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Share2 className="w-6 h-6" />}
            {processingState.isProcessing ? 'Baking Images...' : 'Save Directly to Photos'}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
