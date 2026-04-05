import React from 'react';
import FileCard from './FileCard';

const FileGrid = ({ files, viewMode, onDownload, onDelete, onRestore, onPermanentDelete, onFileClick }) => {
    if (files.length === 0) {
        return (
            <div className="text-center mt-4" style={{ color: 'var(--text-muted)', padding: '2rem 0' }}>
                {viewMode === 'active'
                    ? "No files uploaded yet. Securely store your first file now!"
                    : "Your recycle bin is empty."}
            </div>
        );
    }

    return (
        <div className="file-grid">
            {files.map(file => (
                <FileCard
                    key={file._id}
                    file={file}
                    viewMode={viewMode}
                    onDownload={onDownload}
                    onDelete={onDelete}
                    onRestore={onRestore}
                    onPermanentDelete={onPermanentDelete}
                    onFileClick={() => onFileClick && onFileClick(file)}
                />
            ))}
        </div>
    );
};

export default FileGrid;
