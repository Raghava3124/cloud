import React, { useState } from 'react';
import { Image, Film, FileText, File, Download, Trash2, RefreshCw } from 'lucide-react';
import { formatSize, calculateDaysLeft } from '../utils';
import { API_URL } from '../config';

const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return <Image size={24} />;
    if (mimeType.startsWith('video/')) return <Film size={24} />;
    if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText size={24} />;
    return <File size={24} />;
};

const FileCard = ({ file, viewMode, layout, onDownload, onDelete, onRestore, onPermanentDelete, onFileClick }) => {
    const [thumbError, setThumbError] = useState(false);
    
    const isMedia = file.fileType.startsWith('image/') || file.fileType.startsWith('video/');

    return (
        <div className="file-card" style={{ opacity: viewMode === 'trash' ? 0.7 : 1 }}>
            <div className="flex items-center gap-4" style={{ cursor: 'pointer', flex: layout === 'list' ? 1 : 'unset' }} onClick={onFileClick}>
                <div className="file-icon" style={{ filter: viewMode === 'trash' ? 'grayscale(100%)' : 'none', overflow: 'hidden', padding: (isMedia && !thumbError) ? 0 : '12px' }}>
                    {(isMedia && !thumbError) ? (
                        <img 
                            src={`${API_URL}/api/files/thumbnail/${file._id}`} 
                            alt="thumbnail" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={() => setThumbError(true)}
                        />
                    ) : (
                        getFileIcon(file.fileType)
                    )}
                </div>
                <div className="file-info" style={{ flex: 1, minWidth: 0, display: layout === 'list' ? 'flex' : 'block', alignItems: 'center', gap: '2rem' }}>
                    <div className="file-name" title={file.fileName} style={{ textDecoration: viewMode === 'trash' ? 'line-through' : 'none', flex: layout === 'list' ? 1 : 'unset' }}>
                        {file.fileName}
                    </div>
                    <div className="file-meta" style={{ display: 'flex', flexDirection: layout === 'list' ? 'row' : 'column', gap: layout === 'list' ? '2rem' : '4px', marginTop: layout === 'list' ? 0 : '4px' }}>
                        <span>
                            {viewMode === 'active' ? 'Uploaded on' : 'Deleted on'}: {new Date(viewMode === 'trash' ? file.deletedAt : file.uploadDate).toLocaleDateString()}
                        </span>
                        <span>
                            Size: {formatSize(file.fileSize)}
                            {viewMode === 'trash' && (
                                <span style={{ color: 'var(--danger)', marginLeft: '8px', fontWeight: 500 }}>
                                    ({calculateDaysLeft(file.deletedAt)} days left)
                                </span>
                            )}
                        </span>
                    </div>
                </div>
            </div>
            <div className="mt-3 flex gap-2" style={{ marginTop: layout === 'list' ? 0 : '1rem' }}>
                {viewMode === 'active' ? (
                    <>
                        <button
                            className="btn btn-secondary"
                            style={{ flex: layout === 'list' ? 'unset' : 1, padding: '0.5rem' }}
                            onClick={(e) => { e.stopPropagation(); onDownload(file._id); }}
                            title="Download"
                        >
                            <Download size={16} /> {layout === 'grid' && "Download"}
                        </button>
                        <button
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem', color: 'var(--danger)', borderColor: 'var(--danger)', background: 'transparent' }}
                            onClick={(e) => { e.stopPropagation(); onDelete(file._id); }}
                            title="Move to Trash"
                        >
                            <Trash2 size={16} />
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            className="btn btn-primary"
                            style={{ flex: layout === 'list' ? 'unset' : 1, padding: '0.5rem', background: 'var(--success)', borderColor: 'var(--success)' }}
                            onClick={(e) => { e.stopPropagation(); onRestore(file._id); }}
                            title="Restore File"
                        >
                            <RefreshCw size={16} /> {layout === 'grid' && "Restore"}
                        </button>
                        <button
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem', color: 'var(--danger)', borderColor: 'var(--danger)', background: 'transparent' }}
                            onClick={(e) => { e.stopPropagation(); onPermanentDelete(file._id); }}
                            title="Delete Permanently"
                        >
                            <Trash2 size={16} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default FileCard;
