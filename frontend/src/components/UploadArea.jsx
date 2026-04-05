import React, { useState, useRef } from 'react';
import { UploadCloud, File, ArrowUpCircle } from 'lucide-react';

const UploadArea = ({ onFileUpload, isUploading, uploadProgress, uploadStatus, uploadSpeed }) => {
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await onFileUpload(e.dataTransfer.files[0]);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleChange = async (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            await onFileUpload(e.target.files[0]);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => {
                if (!isUploading) fileInputRef.current.click() 
            }}
            style={{ 
                cursor: isUploading ? 'default' : 'pointer',
                position: 'relative',
                overflow: 'hidden',
                background: dragActive ? 'rgba(59, 130, 246, 0.1)' : 'var(--card-bg)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: dragActive ? '2px dashed var(--primary)' : '2px dashed var(--border)',
                borderRadius: '24px',
                padding: '4rem 2rem',
                textAlign: 'center',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: dragActive ? '0 0 30px rgba(59, 130, 246, 0.2)' : '0 10px 30px -10px rgba(0, 0, 0, 0.3)',
                transform: dragActive ? 'scale(1.02)' : 'scale(1)',
                marginBottom: '2rem'
            }}
        >
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleChange}
            />
            
            {/* Subtle animated background glow */}
            <div style={{
                position: 'absolute',
                top: '-50%', left: '-50%', right: '-50%', bottom: '-50%',
                background: 'conic-gradient(from 0deg at 50% 50%, rgba(59, 130, 246, 0.1) 0deg, transparent 60deg, transparent 300deg, rgba(139, 92, 246, 0.1) 360deg)',
                animation: 'spin 10s linear infinite',
                pointerEvents: 'none',
                opacity: isUploading ? 0.3 : 0.8,
                zIndex: 0
            }}></div>

            <div style={{ position: 'relative', zIndex: 1 }}>
                {isUploading ? (
                    <div style={{ width: '100%', maxWidth: '450px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        
                        <div style={{ 
                            display: 'inline-flex', 
                            padding: '1rem', 
                            background: 'rgba(59, 130, 246, 0.1)', 
                            borderRadius: '50%',
                            margin: '0 auto'
                        }}>
                            <ArrowUpCircle size={48} color="var(--primary)" style={{ animation: 'bounce 2s infinite' }} />
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.4rem', color: 'white', marginBottom: '0.25rem', fontWeight: 600 }}>
                                {uploadStatus || 'Uploading...'}
                            </h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                Please do not close this window
                            </p>
                        </div>
                        
                        <div style={{ 
                            width: '100%', 
                            background: 'rgba(255, 255, 255, 0.05)', 
                            border: '1px solid var(--border)',
                            borderRadius: '100px', 
                            height: '16px', 
                            overflow: 'hidden',
                            position: 'relative'
                        }}>
                            <div 
                                style={{ 
                                    width: `${uploadProgress || 0}%`, 
                                    height: '100%', 
                                    background: 'linear-gradient(90deg, var(--primary), var(--secondary))', 
                                    transition: 'width 0.3s ease',
                                    borderRadius: '100px',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Shine effect */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0, left: 0, bottom: 0, right: 0,
                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                                    transform: 'translateX(-100%)',
                                    animation: 'shimmer 2s infinite'
                                }} />
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <span style={{ 
                                background: 'rgba(255,255,255,0.1)',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                color: 'var(--text-main)', 
                                fontSize: '0.85rem' 
                            }}>
                                {uploadSpeed || 'Calculating...'}
                            </span>
                            <span style={{ color: 'var(--text-main)', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                {uploadProgress || 0}%
                            </span>
                        </div>

                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '80px', height: '80px',
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: '0.5rem',
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 0 20px rgba(59, 130, 246, 0.2) inset'
                        }}>
                            <UploadCloud size={40} color="var(--primary)" />
                        </div>
                        
                        <div>
                            <h3 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>
                                {dragActive ? 'Drop it like it\'s hot!' : 'Drag & Drop files here'}
                            </h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                                or <span style={{ color: 'var(--primary)', cursor: 'pointer' }}>click to browse</span> from your computer
                            </p>
                        </div>
                    </div>
                )}
            </div>
            {/* Global animations for the shimmer and bounce */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10%); }
                }
            `}} />
        </div>
    );
};

export default UploadArea;

