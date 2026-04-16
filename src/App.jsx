import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, CheckCircle, Download, Trash2, Smartphone, Monitor, RefreshCw, Share2, Loader2, Zap } from 'lucide-react';
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
    processedFiles: [] 
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
   * Two-Way Sequential Processing (Zero-Limit Architecture)
   */
  const handleProcessSequential = async (mode = 'zip') => {
    if (images.length === 0) return;
    
    setProcessingState({
      isProcessing: true,
      currentStep: 0,
      totalSteps: images.length,
      status: 'Readying...',
      processedFiles: []
    });

    const results = []; // { name: string, blob: Blob, url: string }
    const zip = new JSZip();

    try {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const isLarge = img.file.size > 1 * 1024 * 1024; // > 1MB for safety on Vercel
        
        setProcessingState(prev => ({ 
          ...prev, 
          currentStep: i + 1,
          status: isLarge ? 'Uploading to Cloud...' : 'Sending to Server...' 
        }));
        
        let blobUrl = null;
        if (isLarge) {
          const blob = await upload(`branding/${img.name}`, img.file, {
            access: 'public',
            handleUploadUrl: '/api/blob-upload'
          });
          blobUrl = blob.url;
        }

        const formData = new FormData();
        if (blobUrl) formData.append('imagePwaUrl', blobUrl);
        else formData.append('image', img.file);
        
        if (logo) formData.append('logo', logo.file);
        formData.append('logoSettings', JSON.stringify(logoSettings));
        formData.append('whatsappSettings', JSON.stringify(whatsappSettings));

        setProcessingState(prev => ({ ...prev, status: 'Branding in Cloud...' }));

        const response = await axios.post(`${API_BASE}/process-single`, formData);
        
        if (response.data.success) {
          const cloudResultUrl = response.data.brandedUrl;
          
          // Fetch the branded image back as a blob for local zipping/sharing
          // This happens client-side and is NOT limited by Vercel's gateway
          setProcessingState(prev => ({ ...prev, status: 'Retrieving Result...' }));
          const blobRes = await fetch(cloudResultUrl);
          const processedBlob = await blobRes.blob();

          results.push({ name: img.name, blob: processedBlob, url: cloudResultUrl });
          
          const fileName = img.name.replace(/\.[^/.]+$/, "") + "_branded.png";
          zip.file(fileName, processedBlob);
        } else {
          throw new Error(response.data.error || 'Unknown branding error');
        }
      }

      setProcessingState(prev => ({ ...prev, status: 'Preparing Bundle...' }));

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
          await navigator.share({
            files: shareFiles,
            title: 'Branded Images',
            text: 'Here are your branded high-res images!'
          });
        } catch (err) {
          console.log('Share canceled');
        }
      }

      setProcessingState(prev => ({ ...prev, processedFiles: results }));
    } catch (err) {
      console.error(err);
      alert('Error: ' + (err.response?.status === 413 ? "Payload Too Large (Vercel limit). Use smaller files or check Vercel Blob settings." : err.message));
    } finally {
      setProcessingState(prev => ({ ...prev, isProcessing: false, status: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 bg-slate-950/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="bg-primary-500 p-2 rounded-lg shadow-lg shadow-primary-500/20">
            <ImageIcon className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tighter">BRANDFLOW<span className="text-primary-500 italic">PRO</span></h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleProcessSequential('zip')}
            disabled={images.length === 0 || processingState.isProcessing}
            className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2 shadow-xl shadow-primary-600/30 ring-1 ring-primary-400/30"
          >
            {processingState.isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {processingState.isProcessing 
              ? `${processingState.status} (${processingState.currentStep}/${processingState.totalSteps})` 
              : 'Secure ZIP Download'
            }
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
        <aside className="w-full md:w-80 border-r border-slate-800 overflow-y-auto p-6 flex flex-col gap-8 bg-slate-950 z-40">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Base Content</h2>
              <span className="bg-green-900/40 text-green-400 text-[9px] px-2 py-0.5 rounded-full border border-green-800/30 flex items-center gap-1 font-bold">
                <Zap className="w-2.5 h-2.5" /> CLOUD MODE
              </span>
            </div>
            <Uploader 
              onUpload={handleLocalUpload} 
              multiple={true} 
              label="Upload Images"
              icon={<Upload className="w-5 h-5" />}
            />
          </section>

          <section>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Identity Logo</h2>
            {!logo ? (
              <Uploader 
                onUpload={(files) => handleLocalLogoUpload(files[0])} 
                multiple={false} 
                label="Upload Logo"
                icon={<ImageIcon className="w-5 h-5" />}
              />
            ) : (
              <div className="relative group rounded-3xl border border-slate-700 p-3 bg-slate-900/50 hover:border-primary-500/50 transition-colors">
                <img src={logo.url} alt="Logo" className="max-h-24 mx-auto object-contain" />
                <button 
                  onClick={() => setLogo(null)}
                  className="absolute -top-2 -right-2 bg-red-600 p-2 rounded-full shadow-2xl hover:bg-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white" />
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

        <main className="flex-1 overflow-y-auto p-4 md:p-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
          {images.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-800 gap-6">
              <div className="w-32 h-32 rounded-full bg-slate-900/50 flex items-center justify-center border-2 border-slate-800 border-dashed animate-pulse">
                <ImageIcon className="w-12 h-12" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-2xl font-bold text-slate-400">Secure Cloud Production</p>
                <p className="text-sm text-slate-600 max-w-xs">Supports high-res images exceeding 10MB per file with Two-Way Cloud processing.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 pb-32">
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
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-6">
          <button 
            onClick={() => handleProcessSequential('share')}
            disabled={processingState.isProcessing}
            className="w-full bg-green-600 hover:bg-green-500 text-white py-5 rounded-3xl font-extrabold shadow-[0_25px_60px_-15px_rgba(22,163,74,0.6)] flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-95 border-b-4 border-green-800"
          >
            {processingState.isProcessing ? <Loader2 className="w-7 h-7 animate-spin" /> : <Share2 className="w-7 h-7" />}
            {processingState.isProcessing ? 'PROCESSING...' : 'SAVE ALL TO PHOTOS'}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
