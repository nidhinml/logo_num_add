import React, { useRef, useState } from 'react';
import { Upload, FilePlus, AlertCircle } from 'lucide-react';

const Uploader = ({ onUpload, multiple = true, label = "Upload", icon = <Upload className="w-5 h-5"/> }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      onUpload(files);
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
       // Filter for images
       const images = files.filter(f => f.type.startsWith('image/'));
       if (images.length > 0) onUpload(images);
       else alert("Please drop image files only.");
    }
  };

  return (
    <div 
      onClick={() => fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all
        ${isDragging 
          ? 'border-primary-500 bg-primary-500/10 scale-[0.98]' 
          : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900'
        }
      `}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        multiple={multiple} 
        accept="image/*" 
        className="hidden" 
      />
      
      <div className={`p-3 rounded-xl ${isDragging ? 'bg-primary-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
        {icon}
      </div>
      
      <div className="text-center">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-slate-500 mt-1">Drag and drop or click</p>
      </div>

      {multiple && (
        <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-medium bg-slate-800/50 px-2 py-0.5 rounded-full">
          <FilePlus className="w-3 h-3" />
          Supports JPG, PNG, WEBP
        </div>
      )}
    </div>
  );
};

export default Uploader;
