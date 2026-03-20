"use client";

import { useState, useRef } from 'react';

export default function UploadBox({ onFileSelect }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      if (onFileSelect) onFileSelect(droppedFile);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (onFileSelect) onFileSelect(selectedFile);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      style={{
        border: `2px dashed ${file ? '#919191' : isDragging ? '#ffffff' : '#474747'}`,
        backgroundColor: file ? 'rgba(255,255,255,0.03)' : isDragging ? 'rgba(255,255,255,0.05)' : 'transparent',
        borderRadius: '20px',
        padding: '48px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    >
      <input 
        type="file" 
        accept=".pdf" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        style={{ display: 'none' }} 
      />
      {file ? (
        <>
          <div style={{ color: '#ffffff', fontSize: '48px', lineHeight: 1 }}>✓</div>
          <span style={{ color: '#e2e2e2', fontSize: '18px', fontWeight: 500 }}>{file.name}</span>
          <span style={{ color: '#919191', fontSize: '14px' }}>Ready for analysis</span>
        </>
      ) : (
        <>
          <div style={{ color: '#c6c6c7', fontSize: '48px', lineHeight: 1 }}>⇧</div>
          <span style={{ color: '#e2e2e2', fontSize: '18px', fontWeight: 500 }}>Drop your resume here</span>
          <span style={{ color: '#919191', fontSize: '14px' }}>or click to browse • PDF supported</span>
        </>
      )}
    </div>
  );
}
