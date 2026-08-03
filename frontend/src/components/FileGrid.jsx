import React from 'react';
import FileCard from './FileCard';
import FolderCard from './FolderCard';

const FileGrid = ({ files, folders = [], viewMode, layout, onDownload, onDelete, onRestore, onPermanentDelete, onFileClick, onFolderClick }) => {
    if (files.length === 0 && folders.length === 0) {
        return (
            <div className="text-center mt-4" style={{ color: 'var(--text-muted)', padding: '2rem 0' }}>
                {viewMode === 'active'
                    ? "This folder is empty. Upload a file or create a folder!"
                    : "Your recycle bin is empty."}
            </div>
        );
    }

    return (
        <div className={`file-grid ${layout === 'list' ? 'list-view' : ''}`}>
            {folders.map(folder => (
                <FolderCard
                    key={folder._id}
                    folder={folder}
                    onClick={onFolderClick}
                    onDelete={onDelete}
                />
            ))}
            
            {files.map(file => (
                <FileCard
                    key={file._id}
                    file={file}
                    viewMode={viewMode}
                    layout={layout}
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
