import React from 'react';
import { Folder, Trash2 } from 'lucide-react';

const FolderCard = ({ folder, onClick, onDelete }) => {
    return (
        <div className="file-card folder-card" style={{ cursor: 'pointer' }}>
            <div className="flex items-center gap-4" onClick={() => onClick(folder)}>
                <div className="file-icon" style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>
                    <Folder size={24} fill="currentColor" />
                </div>
                <div className="file-info" style={{ flex: 1, minWidth: 0 }}>
                    <div className="file-name" title={folder.name}>
                        {folder.name}
                    </div>
                    <div className="file-meta">
                        Folder
                    </div>
                </div>
            </div>
            <div className="mt-3 flex gap-2">
                <button
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem', color: 'var(--danger)', borderColor: 'var(--danger)', background: 'transparent', marginLeft: 'auto' }}
                    onClick={(e) => { e.stopPropagation(); onDelete(folder._id, true); }}
                    title="Delete Folder"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

export default FolderCard;
