import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, CheckCircle, Download, Trash2, Smartphone, Monitor, RefreshCw, Share2, Loader2, Zap, AlertCircle } from 'lucide-react';
import axios from 'axios';
import JSZip from 'jszip';
import { upload } from '@vercel/blob/client';
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
    status: '', 
    processedFiles: [],
    lastError: null
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
   * Diagnostic-Ready Processing
   */
  const handleProcessSequential = async (mode = 'zip') => {
    if (images.length === 0) return;
    
    setProcessingState({
      isProcessing: true,
      currentStep: 0,
      totalSteps: images.length,
      status: 'Readying...',
      processedFiles: [],
      lastError: null
    });

    const results = [];
    const zip = new JSZip();

    try {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const isLarge = img.file.size > 1.5 * 1024 * 1024; // > 1.5MB for safety
        
        setProcessingState(prev => ({ 
          ...prev, 
          currentStep: i + 1,
          status: isLarge ? 'Uploading to Safe Storage...' : 'Sending to Processor...' 
        }));
        
        let blobUrl = null;
        if (isLarge) {
          try {
            const blob = await upload(`branding/${img.name}`, img.file, {
              access: 'public',
              handleUploadUrl: '/api/blob-upload'
            });
            blobUrl = blob.url;
          } catch (blobErr) {
            throw new Error(`CLIENT_UPLOAD_ERROR: ${blobErr.message}`);
          }
        }

        const formData = new FormData();
        if (blobUrl) formData.append('imagePwaUrl', blobUrl);
        else formData.append('image', img.file);
        
        if (logo) formData.append('logo', logo.file);
        formData.append('logoSettings', JSON.stringify(logoSettings));
        formData.append('whatsappSettings', JSON.stringify(whatsappSettings));

        setProcessingState(prev => ({ ...prev, status: 'Branding...' }));

        const response = await axios.post(`${API_BASE}/process-single`, formData).catch(err => {
            // Catch Axios error to extract verbose backend message
            const serverError = err.response?.data?.error || err.message;
            throw new Error(serverError);
        });
        
        if (response.data.success) {
          const cloudResultUrl = response.data.brandedUrl;
          setProcessingState(prev => ({ ...prev, status: 'Finalizing Local Copy...' }));
          const blobRes = await fetch(cloudResultUrl);
          const processedBlob = await blobRes.blob();

          results.push({ name: img.name, blob: processedBlob, url: cloudResultUrl });
          const fileName = img.name.replace(/\.[^/.]+$/, "") + "_branded.png";
          zip.file(fileName, processedBlob);
        }
      }

      setProcessingState(prev => ({ ...prev, status: 'Saving Bundle...' }));

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
        const shareFiles = results.map(r => new File([r.blob], r.name.replace(/\.[^/.]+$/, "") + ".png", { type: 'image/png' }));
        try {
          await navigator.share({ files: shareFiles, title: 'Branded Images' });
        } catch (err) {}
      }

      setProcessingState(prev => ({ ...prev, processedFiles: results }));
    } catch (err) {
      console.error(err);
      setProcessingState(prev => ({ ...prev, lastError: err.message }));
    } finally {
      setProcessingState(prev => ({ ...prev, isProcessing: false, status: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 bg-slate-950/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="bg-primary-500 p-2 rounded-lg">
            <ImageIcon className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight uppercase">BrandFlow<span className="text-primary-500">Pro</span></h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleProcessSequential('zip')}
            disabled={images.length === 0 || processingState.isProcessing}
            className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2 shadow-lg"
          >
            {processingState.isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {processingState.isProcessing ? `Step ${processingState.currentStep}/${processingState.totalSteps}...` : 'Download All'}
          </button>
        </div>
      </header>

      {processingState.lastError && (
        <div className="bg-red-500/10 border-b border-red-500/20 p-4 flex items-center justify-center gap-3 text-red-400 text-sm animate-in slide-in-from-top duration-300">
          <AlertCircle className="w-5 h-5" />
          <div className="flex flex-col">
            <span className="font-bold">System Alert:</span>
            <code className="text-[10px] opacity-80">{processingState.lastError}</code>
          </div>
          <button onClick={() => setProcessingState(prev => ({ ...prev, lastError: null }))} className="bg-red-500/20 px-3 py-1 rounded-md text-[10px] hover:bg-red-500/40 transition-colors">Dismiss</button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
        <aside className="w-full md:w-80 border-r border-slate-800 overflow-y-auto p-6 flex flex-col gap-8 bg-slate-950 z-40">
           <section>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Original Images</h2>
            <Uploader 
              onUpload={handleLocalUpload} 
              multiple={true} 
              label="Select Photos"
              icon={<Upload className="w-5 h-5" />}
            />
          </section>

          <section>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Brand Logo</h2>
            {!logo ? (
              <Uploader 
                onUpload={(files) => handleLocalLogoUpload(files[0])} 
                multiple={false} 
                label="Select Logo"
                icon={<ImageIcon className="w-5 h-5" />}
              />
            ) : (
              <div className="relative group rounded-2xl border border-slate-700 p-3 bg-slate-900/50">
                <img src={logo.url} alt="Logo" className="max-h-20 mx-auto object-contain" />
                <button onClick={() => setLogo(null)} className="absolute -top-2 -right-2 bg-red-600 p-1.5 rounded-full shadow-lg"><Trash2 className="w-3" /></button>
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
            <div className="h-full flex flex-col items-center justify-center text-slate-800 gap-4">
              <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center border-2 border-slate-800 border-dashed animate-pulse">
                <ImageIcon className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-slate-600">CLOUD SYNC ACTIVE</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pb-32">
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] md:w-auto">
          <button 
            onClick={() => handleProcessSequential('share')}
            disabled={processingState.isProcessing}
            className="w-full bg-green-600 hover:bg-green-500 text-white px-10 py-5 rounded-3xl font-black shadow-2xl flex items-center justify-center gap-4 transition-all"
          >
            {processingState.isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Share2 className="w-6 h-6" />}
            {processingState.isProcessing ? 'PROCESSING...' : 'SAVE ALL TO PHOTOS'}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
