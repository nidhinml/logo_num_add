import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const Uploader = ({ onUpload, multiple = false, label = "Upload", icon }) => {
  const onDrop = useCallback(acceptedFiles => {
    onUpload(acceptedFiles);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    }
  });

  return (
    <div 
      {...getRootProps()} 
      className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-6 transition-all duration-300 text-center flex flex-col items-center justify-center gap-2 ${
        isDragActive 
        ? 'border-primary-500 bg-primary-500/10 scale-[1.02]' 
        : 'border-slate-800 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-900'
      }`}
    >
      <input {...getInputProps()} />
      <div className={`p-3 rounded-full bg-slate-800 transition-colors ${isDragActive ? 'text-primary-400 bg-primary-950' : 'text-slate-400 group-hover:text-primary-400'}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-300">{label}</p>
        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tight">Drag and drop or click</p>
      </div>
    </div>
  );
};

export default Uploader;
