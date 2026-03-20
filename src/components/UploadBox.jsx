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
        border: `2px dashed ${file ? '#10B981' : isDragging ? '#8B5CF6' : '#333'}`,
        backgroundColor: file ? 'rgba(16,185,129,0.05)' : isDragging ? 'rgba(139,92,246,0.05)' : 'transparent',
        borderRadius: '16px',
        padding: '48px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
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
          <div style={{ color: '#10B981', fontSize: '48px', lineHeight: 1 }}>✓</div>
          <span style={{ color: 'white', fontSize: '18px', fontWeight: 500 }}>{file.name}</span>
          <span style={{ color: '#10B981', fontSize: '14px' }}>Ready for analysis</span>
        </>
      ) : (
        <>
          <div style={{ color: '#8B5CF6', fontSize: '48px', lineHeight: 1 }}>⇧</div>
          <span style={{ color: 'white', fontSize: '18px', fontWeight: 500 }}>Drop your resume here</span>
          <span style={{ color: '#888', fontSize: '14px' }}>or click to browse • PDF supported</span>
        </>
      )}
    </div>
  );
}
