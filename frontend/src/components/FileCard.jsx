import React from 'react';
import { Image, Film, FileText, File, Download, Trash2, RefreshCw } from 'lucide-react';
import { formatSize, calculateDaysLeft } from '../utils';

const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return <Image size={24} />;
    if (mimeType.startsWith('video/')) return <Film size={24} />;
    if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText size={24} />;
    return <File size={24} />;
};

const FileCard = ({ file, viewMode, onDownload, onDelete, onRestore, onPermanentDelete, onFileClick }) => {
    return (
        <div className="file-card" style={{ opacity: viewMode === 'trash' ? 0.7 : 1 }}>
            <div className="flex items-center gap-4" style={{ cursor: 'pointer' }} onClick={onFileClick}>
                <div className="file-icon" style={{ filter: viewMode === 'trash' ? 'grayscale(100%)' : 'none' }}>
                    {getFileIcon(file.fileType)}
                </div>
                <div className="file-info" style={{ flex: 1, minWidth: 0 }}>
                    <div className="file-name" title={file.fileName} style={{ textDecoration: viewMode === 'trash' ? 'line-through' : 'none' }}>
                        {file.fileName}
                    </div>
                    <div className="file-meta" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
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
            <div className="mt-3 flex gap-2">
                {viewMode === 'active' ? (
                    <>
                        <button
                            className="btn btn-secondary"
                            style={{ flex: 1, padding: '0.5rem' }}
                            onClick={() => onDownload(file._id)}
                            title="Download"
                        >
                            <Download size={16} /> Download
                        </button>
                        <button
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem', color: 'var(--danger)', borderColor: 'var(--danger)', background: 'transparent' }}
                            onClick={() => onDelete(file._id)}
                            title="Move to Trash"
                        >
                            <Trash2 size={16} />
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            className="btn btn-primary"
                            style={{ flex: 1, padding: '0.5rem', background: 'var(--success)', borderColor: 'var(--success)' }}
                            onClick={() => onRestore(file._id)}
                            title="Restore File"
                        >
                            <RefreshCw size={16} /> Restore File
                        </button>
                        <button
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem', color: 'var(--danger)', borderColor: 'var(--danger)', background: 'transparent' }}
                            onClick={() => onPermanentDelete(file._id)}
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
