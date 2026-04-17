import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, CheckCircle, Download, Trash2, Smartphone, Monitor, RefreshCw, Share2, Loader2, Zap, AlertCircle, Wand2, Scissors, Layout, Play, Move, Save } from 'lucide-react';
import axios from 'axios';
import JSZip from 'jszip';
import { upload } from '@vercel/blob/client';
import BrandingControls from './components/BrandingControls';
import ImagePreview from './components/ImagePreview';
import Uploader from './components/Uploader';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState('branding'); // 'branding' | 'studio'

  // Branding State
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
    enabled: false, number: '', fontSize: 24, color: '#ffffff', position: 'bottom-left',
    offset: { x: 20, y: 20 }, showIcon: true, showNumber: true, fontStyle: 'modern'
  });
  
  // AI Studio State
  const [studioState, setStudioState] = useState({
    sourceImage: null,
    removedBgUrl: null,
    generatedBgUrl: null,
    finalCompositionUrl: null,
    prompt: '',
    isRemovingBg: false,
    isGeneratingBg: false,
    isComposing: false,
    scale: 0.6,
    yOffset: 0
  });

  const [processingState, setProcessingState] = useState({
    isProcessing: false, currentStep: 0, totalSteps: 0, status: '', processedFiles: [], lastError: null
  });

  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(!!navigator.share);
  }, []);

  const handleLocalUpload = (files) => {
    const newImages = files.map(file => ({
      file, name: file.name, url: URL.createObjectURL(file)
    }));
    setImages([...images, ...newImages]);
  };

  const handleLocalLogoUpload = (file) => {
    if (logo) URL.revokeObjectURL(logo.url);
    setLogo({ file, url: URL.createObjectURL(file) });
  };

  /**
   * AI Studio Actions
   */
  const handleRemoveBackground = async () => {
    if (!studioState.sourceImage) return;
    setStudioState(prev => ({ ...prev, isRemovingBg: true }));
    try {
      const formData = new FormData();
      formData.append('image', studioState.sourceImage.file);
      const res = await axios.post(`${API_BASE}/ai/remove-bg`, formData);
      setStudioState(prev => ({ ...prev, removedBgUrl: res.data.url, isRemovingBg: false }));
    } catch (err) {
      setProcessingState(prev => ({ ...prev, lastError: "Background removal failed. Is HF_TOKEN set?" }));
      setStudioState(prev => ({ ...prev, isRemovingBg: false }));
    }
  };

  const handleGenerateBackground = async () => {
    if (!studioState.prompt) return;
    setStudioState(prev => ({ ...prev, isGeneratingBg: true }));
    try {
      const res = await axios.post(`${API_BASE}/ai/generate-bg`, { prompt: studioState.prompt });
      setStudioState(prev => ({ ...prev, generatedBgUrl: res.data.url, isGeneratingBg: false }));
    } catch (err) {
      setProcessingState(prev => ({ ...prev, lastError: "Background generation failed. Is HF_TOKEN set?" }));
      setStudioState(prev => ({ ...prev, isGeneratingBg: false }));
    }
  };

  const handleCompose = async () => {
    if (!studioState.removedBgUrl || !studioState.generatedBgUrl) return;
    setStudioState(prev => ({ ...prev, isComposing: true }));
    try {
        const res = await axios.post(`${API_BASE}/ai/composite`, {
            foregroundUrl: studioState.removedBgUrl,
            backgroundUrl: studioState.generatedBgUrl,
            settings: JSON.stringify({ scale: studioState.scale, yOffset: studioState.yOffset })
        });
        setStudioState(prev => ({ ...prev, finalCompositionUrl: res.data.url, isComposing: false }));
    } catch (err) {
        setProcessingState(prev => ({ ...prev, lastError: "Composition failed." }));
        setStudioState(prev => ({ ...prev, isComposing: false }));
    }
  };

  /**
   * Branding Engines
   */
  const handleProcessSequential = async (mode = 'zip') => {
    if (images.length === 0) return;
    setProcessingState({ isProcessing: true, currentStep: 0, totalSteps: images.length, status: 'Readying...', processedFiles: [], lastError: null });
    const results = [];
    const zip = new JSZip();

    try {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const isLarge = img.file.size > 1.5 * 1024 * 1024;
        setProcessingState(prev => ({ ...prev, currentStep: i + 1, status: isLarge ? 'Uploading to Safe Storage...' : 'Sending to Processor...' }));
        
        let blobUrl = null;
        if (isLarge) {
          const blob = await upload(`branding/${img.name}`, img.file, { access: 'public', handleUploadUrl: '/api/blob-upload' });
          blobUrl = blob.url;
        }

        const formData = new FormData();
        if (blobUrl) formData.append('imagePwaUrl', blobUrl);
        else formData.append('image', img.file);
        if (logo) formData.append('logo', logo.file);
        formData.append('logoSettings', JSON.stringify(logoSettings));
        formData.append('whatsappSettings', JSON.stringify(whatsappSettings));

        setProcessingState(prev => ({ ...prev, status: 'Branding...' }));
        const response = await axios.post(`${API_BASE}/process-single`, formData).catch(err => {
            throw new Error(err.response?.data?.error || err.message);
        });
        
        if (response.data.success) {
          const cloudResultUrl = response.data.brandedUrl;
          const processedBlob = await (await fetch(cloudResultUrl)).blob();
          results.push({ name: img.name, blob: processedBlob, url: cloudResultUrl });
          zip.file(img.name.replace(/\.[^/.]+$/, "") + "_branded.png", processedBlob);
        }
      }

      if (mode === 'zip') {
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = 'branded_images.zip';
        link.click();
      } else if (mode === 'share' && canShare) {
        const shareFiles = results.map(r => new File([r.blob], r.name.replace(/\.[^/.]+$/, "") + ".png", { type: 'image/png' }));
        await navigator.share({ files: shareFiles, title: 'Branded Images' });
      }
      setProcessingState(prev => ({ ...prev, processedFiles: results }));
    } catch (err) { setProcessingState(prev => ({ ...prev, lastError: err.message })); }
    finally { setProcessingState(prev => ({ ...prev, isProcessing: false, status: '' })); }
  };

  const handleShareIndividual = async (processedFile) => {
    if (!canShare) return;
    try {
      const file = new File([processedFile.blob], processedFile.name.replace(/\.[^/.]+$/, "") + ".png", { type: 'image/png' });
      await navigator.share({ files: [file], title: 'Branded Image' });
    } catch (err) {}
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 bg-slate-950/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-primary-500 p-2 rounded-lg">
                <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight uppercase">BrandFlow<span className="text-primary-500">AI</span></h1>
          </div>

          <nav className="flex items-center bg-slate-900/50 rounded-xl p-1 p-1 border border-slate-800">
            <button 
              onClick={() => setActiveTab('branding')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'branding' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Scissors className="w-3.5 h-3.5" />
              Batch Branding
            </button>
            <button 
              onClick={() => setActiveTab('studio')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'studio' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              AI Studio
            </button>
          </nav>
        </div>
        
        {activeTab === 'branding' && (
          <button 
            onClick={() => handleProcessSequential('zip')}
            disabled={images.length === 0 || processingState.isProcessing}
            className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2 shadow-lg text-sm"
          >
            {processingState.isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {processingState.isProcessing ? `Steps...` : 'Download All'}
          </button>
        )}
      </header>

      {processingState.lastError && (
        <div className="bg-red-500/10 border-b border-red-500/20 p-4 flex items-center justify-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5" />
          <span className="font-bold underline">{processingState.lastError}</span>
          <button onClick={() => setProcessingState(prev => ({ ...prev, lastError: null }))} className="bg-red-500/20 px-3 py-1 rounded-md text-[10px]">Dismiss</button>
        </div>
      )}

      {activeTab === 'branding' ? (
        <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
            <aside className="w-full md:w-80 border-r border-slate-800 overflow-y-auto p-6 flex flex-col gap-8 bg-slate-950 z-40">
                <section>
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Original Images</h2>
                    <Uploader onUpload={handleLocalUpload} multiple={true} label="Select Photos" icon={<Upload className="w-5 h-5" />} />
                </section>
                <section>
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Brand Logo</h2>
                    {!logo ? (
                        <Uploader onUpload={(files) => handleLocalLogoUpload(files[0])} multiple={false} label="Select Logo" icon={<ImageIcon className="w-5 h-5" />} />
                    ) : (
                        <div className="relative group rounded-2xl border border-slate-700 p-3 bg-slate-900/50">
                            <img src={logo.url} alt="Logo" className="max-h-20 mx-auto object-contain" />
                            <button onClick={() => setLogo(null)} className="absolute -top-2 -right-2 bg-red-600 p-1.5 rounded-full shadow-lg"><Trash2 className="w-3" /></button>
                        </div>
                    )}
                </section>
                <BrandingControls logoSettings={logoSettings} setLogoSettings={setLogoSettings} whatsappSettings={whatsappSettings} setWhatsappSettings={setWhatsappSettings} />
            </aside>

            <main className="flex-1 overflow-y-auto p-4 md:p-10 bg-slate-950">
                {images.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-800 gap-4">
                        <Monitor className="w-16 h-16 opacity-20" />
                        <p className="text-xs font-bold text-slate-600 tracking-widest">DRAG IMAGES TO BEGIN</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pb-32">
                        {images.map((img, idx) => (
                            <ImagePreview key={idx} image={img} logo={logo} logoSettings={logoSettings} whatsappSettings={whatsappSettings} processed={processingState.processedFiles.find(f => f.name === img.name)} onSave={handleShareIndividual} />
                        ))}
                    </div>
                )}
            </main>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center p-4 md:p-12 gap-8 overflow-y-auto scrollbar-hide">
            <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1. Upload & Background Removal */}
                <div className="bg-slate-900/40 rounded-3xl p-8 border border-slate-800 flex flex-col gap-6 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Scissors className="w-20 h-20" /></div>
                    <h3 className="text-xl font-bold flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center text-sm">1</span> Remove Background</h3>
                    
                    {!studioState.sourceImage ? (
                        <Uploader onUpload={(f) => setStudioState(prev => ({ ...prev, sourceImage: { file: f[0], url: URL.createObjectURL(f[0]) } }))} label="Upload Product" />
                    ) : (
                        <div className="space-y-4">
                            <div className="aspect-square rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 relative">
                                <img src={studioState.removedBgUrl || studioState.sourceImage.url} className="w-full h-full object-contain p-4" />
                                {studioState.isRemovingBg && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-400" /></div>}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleRemoveBackground} disabled={studioState.isRemovingBg || !!studioState.removedBgUrl} className="flex-1 bg-primary-600 hover:bg-primary-500 disabled:bg-slate-800 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2">
                                    {studioState.removedBgUrl ? <CheckCircle className="w-4 h-4" /> : <Scissors className="w-4 h-4" />}
                                    {studioState.removedBgUrl ? 'Background Extracted' : 'Extract Product'}
                                </button>
                                <button onClick={() => setStudioState(prev => ({ ...prev, sourceImage: null, removedBgUrl: null }))} className="bg-slate-800 p-3 rounded-xl hover:bg-red-900/40 transition-colors"><Trash2 className="w-5 h-5" /></button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. AI Background Generation */}
                <div className="bg-slate-900/40 rounded-3xl p-8 border border-slate-800 flex flex-col gap-6 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Zap className="w-20 h-20" /></div>
                    <h3 className="text-xl font-bold flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm">2</span> Generate Backdrop</h3>
                    
                    <div className="flex-1 flex flex-col gap-4">
                        <textarea 
                            value={studioState.prompt}
                            onChange={(e) => setStudioState(prev => ({ ...prev, prompt: e.target.value }))}
                            placeholder="Describe your scene: e.g. Minimalist marble table, warm sun lighting, organic shadows..."
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none max-h-32"
                        />
                        <div className="aspect-video rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 relative">
                            {studioState.generatedBgUrl ? <img src={studioState.generatedBgUrl} className="w-full h-full object-cover" /> : (
                                <div className="h-full flex items-center justify-center text-slate-600 italic text-[10px] uppercase tracking-widest">AI Result View</div>
                            )}
                            {studioState.isGeneratingBg && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                                <span className="text-[10px] font-bold text-purple-200">Generating AI Art...</span>
                            </div>}
                        </div>
                        <button onClick={handleGenerateBackground} disabled={studioState.isGeneratingBg || !studioState.prompt} className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2">
                            <Wand2 className="w-4 h-4" />
                            {studioState.generatedBgUrl ? 'Regenerate' : 'Generate Background'}
                        </button>
                    </div>
                </div>

                {/* 3. Composition & Shadow Logic */}
                <div className="bg-slate-900/40 rounded-3xl p-8 border border-slate-800 flex flex-col gap-6 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Layout className="w-20 h-20" /></div>
                    <h3 className="text-xl font-bold flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-sm">3</span> Final Studio</h3>
                    
                    <div className="flex-1 flex flex-col gap-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Move className="w-3 h-3" /> Scale Product</label>
                                <input type="range" min="0.1" max="1" step="0.05" value={studioState.scale} onChange={(e) => setStudioState(prev => ({ ...prev, scale: parseFloat(e.target.value) }))} className="w-full accent-green-500" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Move className="w-3 h-3 rotate-90" /> Vertical Offset</label>
                                <input type="range" min="-200" max="200" step="1" value={studioState.yOffset} onChange={(e) => setStudioState(prev => ({ ...prev, yOffset: parseInt(e.target.value) }))} className="w-full accent-green-500" />
                            </div>
                        </div>

                        <div className="aspect-square rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 relative shadow-inner">
                            {studioState.finalCompositionUrl ? <img src={studioState.finalCompositionUrl} className="w-full h-full object-contain animate-in zoom-in-95 duration-700" /> : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4">
                                    <div className="w-12 h-12 rounded-full border border-slate-700 border-dashed flex items-center justify-center"><Play className="w-4 h-4 opacity-30" /></div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Ready to Composite</span>
                                </div>
                            )}
                            {studioState.isComposing && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-green-400" />
                                <span className="text-[10px] font-bold text-green-200">Matching Lighting...</span>
                            </div>}
                        </div>

                        <div className="flex gap-2">
                            <button onClick={handleCompose} disabled={studioState.isComposing || !studioState.removedBgUrl || !studioState.generatedBgUrl} className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-slate-800 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2">
                                <Monitor className="w-4 h-4" />
                                Composite Shot
                            </button>
                            {studioState.finalCompositionUrl && (
                                <a href={studioState.finalCompositionUrl} download="ai_product_shot.png" className="bg-slate-800 hover:bg-slate-700 p-3 rounded-xl transition-colors flex items-center justify-center shadow-lg">
                                    <Save className="w-5 h-5 text-green-400" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-800 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                <RefreshCw className="w-3 h-3 animate-reverse-spin" /> Free AI Inference Active
            </div>
        </div>
      )}

      {activeTab === 'branding' && images.length > 0 && canShare && (
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
