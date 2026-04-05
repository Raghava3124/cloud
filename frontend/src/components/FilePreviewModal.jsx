import React, { useState, useEffect } from 'react';
import { X, FileText, DownloadCloud, AlertCircle, Loader } from 'lucide-react';
import { formatSize } from '../utils';

const FilePreviewModal = ({ file, onClose }) => {
    if (!file) return null;

    const streamUrl = `http://localhost:5000/api/files/stream/${file._id}`;
    
    const isVideo = file.fileType.startsWith('video/');
    const isImage = file.fileType.startsWith('image/');
    const isAudio = file.fileType.startsWith('audio/');
    
    // Check for specific document types
    const isPdf = file.fileType === 'application/pdf' || file.fileName.toLowerCase().endsWith('.pdf');
    const isText = file.fileType.startsWith('text/') || ['.txt', '.csv'].some(ext => file.fileName.toLowerCase().endsWith(ext));


    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.95)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)'
        }}>
            {/* Header */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                padding: '1.5rem 2.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
                zIndex: 10000
            }}>
                <div style={{ color: 'white' }}>
                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{file.fileName}</h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>{formatSize(file.fileSize)} • {new Date(file.uploadDate).toLocaleString()}</p>
                </div>
                <button 
                    onClick={onClose}
                    style={{ 
                        background: 'rgba(255,255,255,0.1)', 
                        border: '1px solid rgba(255,255,255,0.2)', 
                        color: 'white', 
                        borderRadius: '50%', 
                        padding: '0.75rem', 
                        cursor: 'pointer', 
                        display: 'flex',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                >
                    <X size={24} />
                </button>
            </div>

            {/* Content Body */}
            <div style={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '6rem 2rem 2rem',
                boxSizing: 'border-box'
            }}>
                {isVideo ? (
                    <video 
                        controls 
                        autoPlay 
                        style={{ maxWidth: '95%', maxHeight: '95%', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                        src={streamUrl} 
                    />
                ) : isImage ? (
                    <img 
                        src={streamUrl} 
                        alt={file.fileName}
                        style={{ maxWidth: '95%', maxHeight: '95%', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', objectFit: 'contain' }}
                    />
                ) : isAudio ? (
                    <div style={{ background: 'var(--card-bg)', padding: '4rem', borderRadius: '24px', textAlign: 'center', border: '1px solid var(--border)' }}>
                         <audio controls autoPlay src={streamUrl} style={{ marginTop: '1rem', width: '350px' }} />
                    </div>
                ) : isPdf || isText ? (
                    <div style={{ width: '90%', height: '95%', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
                        <iframe 
                            src={`${streamUrl}#toolbar=1&navpanes=0&scrollbar=1&zoom=100`} 
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            title={file.fileName}
                        />
                    </div>
                ) : (
                    <div style={{ background: 'var(--card-bg)', padding: '4rem', borderRadius: '24px', textAlign: 'center', color: 'white', border: '1px solid var(--border)', maxWidth: '500px' }}>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <AlertCircle size={40} color="var(--danger)" />
                        </div>
                        <h3 style={{ fontSize: '1.6rem', marginBottom: '1.5rem' }}>Preview Not Available</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>This file type cannot be previewed directly in the browser.</p>
                        <a 
                            href={`http://localhost:5000/api/files/download/${file._id}`}
                            target="_blank" 
                            rel="noreferrer"
                            className="btn btn-primary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 2.5rem', borderRadius: '100px' }}
                        >
                            <DownloadCloud size={20} />
                            Download File
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FilePreviewModal;
