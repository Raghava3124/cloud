import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { LogOut, UploadCloud, Trash2, HardDrive, AlertCircle, User, X, Search, Filter, LayoutGrid, List as ListIcon, FolderPlus, Folder as FolderIcon, ChevronRight, Moon, Sun, ArrowUp, ArrowDown } from 'lucide-react';
import toast from 'react-hot-toast';
import UploadArea from './UploadArea';
import FileGrid from './FileGrid';
import { formatSize } from '../utils';
import FilePreviewModal from './FilePreviewModal';
import { API_URL } from '../config';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [files, setFiles] = useState([]);
    const [folders, setFolders] = useState([]);
    const [trashedFiles, setTrashedFiles] = useState([]);
    
    // View States
    const [viewMode, setViewMode] = useState('active'); // 'active' | 'trash'
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [layout, setLayout] = useState('grid'); // 'grid' | 'list'
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    
    // Folder Navigation
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [breadcrumbs, setBreadcrumbs] = useState([{ _id: null, name: 'Home' }]);

    // Filter, Search, Sort
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [sortOption, setSortOption] = useState('Date (Newest)');

    const [totalStorage, setTotalStorage] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState('');
    const [uploadSpeed, setUploadSpeed] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFile, setSelectedFile] = useState(null);

    // Apply theme
    useEffect(() => {
        if (theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const fetchFilesAndFolders = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            // Get Active files for current folder
            const res = await axios.get(`${API_URL}/api/files?folderId=${currentFolderId}`, { headers });
            setFiles(res.data);

            // Get Folders for current folder
            if (viewMode === 'active') {
                const folderRes = await axios.get(`${API_URL}/api/folders?parentId=${currentFolderId}`, { headers });
                setFolders(folderRes.data);
            } else {
                setFolders([]);
            }

            // Get Trashed files
            const trashedRes = await axios.get(`${API_URL}/api/files/trashed`, { headers });
            setTrashedFiles(trashedRes.data);

            // Get Total Storage
            const storageRes = await axios.get(`${API_URL}/api/files/storage`, { headers });
            setTotalStorage(storageRes.data.totalBytes);

        } catch (err) {
            console.error('Error fetching data:', err);
            toast.error('Failed to load files.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFilesAndFolders();
    }, [currentFolderId, viewMode]);

    const handleCreateFolder = async () => {
        const name = prompt("Enter folder name:");
        if (!name) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/folders`, { name, parentFolderId: currentFolderId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Folder created!");
            fetchFilesAndFolders();
        } catch (error) {
            console.error('Create folder error:', error);
            toast.error("Failed to create folder");
        }
    };

    const handleFolderClick = (folder) => {
        setCurrentFolderId(folder._id);
        setBreadcrumbs([...breadcrumbs, folder]);
    };

    const handleBreadcrumbClick = (index) => {
        const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
        setBreadcrumbs(newBreadcrumbs);
        setCurrentFolderId(newBreadcrumbs[newBreadcrumbs.length - 1]._id);
    };

    const handleFileUpload = async (file) => {
        setIsUploading(true);
        setUploadProgress(0);
        setUploadSpeed('');
        setUploadStatus('Stage 1: Uploading to Server...');

        const uploadId = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
        const formData = new FormData();
        formData.append('file', file);
        formData.append('uploadId', uploadId);
        if (currentFolderId) {
            formData.append('folderId', currentFolderId);
        }

        let evtSource = null;
        let lastTime = Date.now();
        let lastLoaded = 0;

        try {
            const token = localStorage.getItem('token');
            evtSource = new EventSource(`${API_URL}/api/files/progress/${uploadId}`);
            let tgLastTime = Date.now();
            let tgLastPercentage = 0;

            evtSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.status === 'uploading' && data.progress !== undefined) {
                    setUploadStatus('Stage 2: Securing to Cloud Servers...');
                    setUploadProgress(data.progress);
                    
                    const now = Date.now();
                    const timeDiff = (now - tgLastTime) / 1000;
                    if (timeDiff >= 0.5 && data.progress > tgLastPercentage) {
                        const percentDiff = data.progress - tgLastPercentage;
                        const bytesDiff = (percentDiff / 100) * file.size;
                        const speedMB = bytesDiff / (1024 * 1024 * timeDiff);
                        setUploadSpeed(`${speedMB.toFixed(2)} MB/s`);
                        tgLastTime = now;
                        tgLastPercentage = data.progress;
                    }
                } else if (data.status === 'completed') {
                    evtSource.close();
                }
            };

            await axios.post(`${API_URL}/api/files/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        
                        const now = Date.now();
                        const timeDiff = (now - lastTime) / 1000;
                        if (timeDiff >= 0.5) {
                            const bytesDiff = progressEvent.loaded - lastLoaded;
                            const speedMB = bytesDiff / (1024 * 1024 * timeDiff);
                            setUploadSpeed(`${speedMB.toFixed(2)} MB/s`);
                            lastTime = now;
                            lastLoaded = progressEvent.loaded;
                        }

                        setUploadStatus(prevStat => {
                            if (prevStat === 'Stage 1: Uploading to Server...') {
                                setUploadProgress(percentCompleted);
                                if (percentCompleted === 100) {
                                    setUploadProgress(0);
                                    setUploadSpeed('Finalizing...');
                                    return 'Processing Server Handshake...';
                                }
                                return prevStat;
                            }
                            return prevStat;
                        });
                    }
                }
            });

            if (evtSource) evtSource.close();
            toast.success('File uploaded and secured successfully!');
            await fetchFilesAndFolders();
        } catch (err) {
            console.error('Upload error:', err);
            toast.error('Failed to upload file.');
            if (evtSource) evtSource.close();
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            setUploadSpeed('');
            setUploadStatus('');
        }
    };

    const handleDownload = (fileId) => {
        window.open(`${API_URL}/api/files/download/${fileId}`, '_blank');
    };

    const handleDelete = async (fileId, isFolder = false) => {
        try {
            const token = localStorage.getItem('token');
            if (isFolder) {
                if (!window.confirm("Are you sure you want to permanently delete this folder? It must be empty first.")) return;
                await axios.delete(`${API_URL}/api/folders/${fileId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Folder deleted.');
            } else {
                await axios.delete(`${API_URL}/api/files/${fileId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('File moved to trash.');
            }
            await fetchFilesAndFolders();
        } catch (err) {
            console.error('Delete error:', err);
            toast.error(err.response?.data?.error || 'Failed to delete item.');
        }
    };

    const handleRestore = async (fileId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/api/files/restore/${fileId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('File restored successfully.');
            await fetchFilesAndFolders();
        } catch (err) {
            console.error('Restore error:', err);
            toast.error('Failed to restore file.');
        }
    };

    const handlePermanentDelete = async (fileId) => {
        if (!window.confirm("Are you sure you want to permanently delete this file? This action cannot be undone.")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/files/permanent/${fileId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('File deleted permanently.');
            await fetchFilesAndFolders();
        } catch (err) {
            console.error('Permanent delete error:', err);
            toast.error('Failed to permanently delete file.');
        }
    };

    // Advanced Filtering and Sorting
    const getFilteredAndSortedFiles = () => {
        let displayFiles = viewMode === 'active' ? files : trashedFiles;

        // 1. Search Filter
        if (searchQuery) {
            displayFiles = displayFiles.filter(f => f.fileName.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        // 2. Type Filter
        if (filterType !== 'All') {
            displayFiles = displayFiles.filter(f => {
                if (filterType === 'Images') return f.fileType.startsWith('image/');
                if (filterType === 'Videos') return f.fileType.startsWith('video/');
                if (filterType === 'Docs') return !f.fileType.startsWith('image/') && !f.fileType.startsWith('video/') && !f.fileType.startsWith('audio/');
                return true;
            });
        }

        // 3. Sort
        displayFiles.sort((a, b) => {
            if (sortOption === 'Date (Newest)') return new Date(b.uploadDate || b.deletedAt) - new Date(a.uploadDate || a.deletedAt);
            if (sortOption === 'Date (Oldest)') return new Date(a.uploadDate || a.deletedAt) - new Date(b.uploadDate || b.deletedAt);
            if (sortOption === 'Size (Largest)') return b.fileSize - a.fileSize;
            if (sortOption === 'Size (Smallest)') return a.fileSize - b.fileSize;
            if (sortOption === 'Name (A-Z)') return a.fileName.localeCompare(b.fileName);
            if (sortOption === 'Name (Z-A)') return b.fileName.localeCompare(a.fileName);
            return 0;
        });

        return displayFiles;
    };

    return (
        <div>
            <nav className="navbar" style={{ padding: '1rem 2rem' }}>
                <div className="flex items-center gap-4">
                    <UploadCloud className="text-primary" size={28} />
                    <h2 className="gradient-text" style={{ margin: 0 }}>SkyVault</h2>

                    <div className="hidden-mobile flex items-center gap-2 ml-4" style={{ background: 'rgba(var(--primary-rgb), 0.1)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem' }}>
                        <HardDrive size={16} className="text-primary" style={{ color: "var(--primary)" }} />
                        <span style={{ color: "var(--primary)", fontWeight: 500 }}>
                            {formatSize(totalStorage)} Used
                        </span>
                    </div>
                </div>
                
                {/* Desktop Right Side */}
                <div className="hidden-mobile flex items-center gap-4">
                    <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <span style={{ color: 'var(--text-muted)' }}>{user.email}</span>
                    <button className="btn btn-secondary" onClick={logout} style={{ padding: '0.5rem 1rem' }}>
                        <LogOut size={16} /> Logout
                    </button>
                </div>

                {/* Mobile Profile Icon */}
                <div className="show-mobile">
                    <button onClick={() => setShowMobileMenu(true)} style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid var(--border)', color: 'var(--primary)', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                        <User size={24} />
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Modal */}
            {showMobileMenu && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)',
                    zIndex: 9999, display: 'flex', flexDirection: 'column',
                    padding: '2rem'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '8px' }}>
                            {theme === 'dark' ? <Sun size={28} /> : <Moon size={28} />}
                        </button>
                        <button onClick={() => setShowMobileMenu(false)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
                            <X size={32} />
                        </button>
                    </div>

                    <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: '72px', height: '72px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                                <User size={36} color="white" />
                            </div>
                            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.4rem' }}>{user.name || 'User'}</h3>
                            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem', marginTop: '0.25rem' }}>{user.email}</p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(59, 130, 246, 0.1)', padding: '1.25rem', borderRadius: '12px' }}>
                            <HardDrive size={28} className="text-primary" />
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Storage Used</div>
                                <div style={{ color: "var(--primary)", fontWeight: 'bold', fontSize: '1.4rem' }}>{formatSize(totalStorage)}</div>
                            </div>
                        </div>

                        <button 
                            onClick={() => { 
                                setViewMode('trash'); 
                                setShowMobileMenu(false); 
                            }} 
                            style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1.25rem', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 600, transition: 'all 0.2s' }}
                        >
                            <Trash2 size={24} /> Recycle Bin
                        </button>

                        <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '1.25rem', borderRadius: '12px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 600, marginTop: '1rem', transition: 'all 0.2s' }}>
                            <LogOut size={24} /> Logout
                        </button>
                    </div>
                </div>
            )}

            <UploadArea 
                onFileUpload={handleFileUpload} 
                isUploading={isUploading} 
                uploadProgress={uploadProgress}
                uploadStatus={uploadStatus}
                uploadSpeed={uploadSpeed}
            />

            <div className="mt-4">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div className="flex gap-4">
                        <h3
                            style={{
                                fontSize: '1.2rem',
                                cursor: 'pointer',
                                color: viewMode === 'active' ? 'var(--text-main)' : 'var(--text-muted)',
                                borderBottom: viewMode === 'active' ? '2px solid var(--primary)' : 'none',
                                paddingBottom: '0.4rem',
                                transition: 'all 0.2s'
                            }}
                            onClick={() => setViewMode('active')}
                        >
                            My Files
                        </h3>
                        <h3
                            style={{
                                fontSize: '1.2rem',
                                cursor: 'pointer',
                                color: viewMode === 'trash' ? 'var(--danger)' : 'var(--text-muted)',
                                borderBottom: viewMode === 'trash' ? '2px solid var(--danger)' : 'none',
                                paddingBottom: '0.4rem',
                                transition: 'all 0.2s'
                            }}
                            onClick={() => setViewMode('trash')}
                        >
                            <Trash2 size={18} style={{ display: 'inline', marginRight: '6px' }} />
                            Recycle Bin
                        </h3>
                    </div>

                    {/* Toolbar: Search, Filters, Sort, Layout */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                            <input 
                                type="text" 
                                placeholder="Search files..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ padding: '0.5rem 1rem 0.5rem 2rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '0.9rem', width: '200px' }}
                            />
                        </div>

                        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                            <option value="All">All Types</option>
                            <option value="Images">Images</option>
                            <option value="Videos">Videos</option>
                            <option value="Docs">Documents</option>
                        </select>

                        <select value={sortOption} onChange={e => setSortOption(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                            <option value="Date (Newest)">Newest</option>
                            <option value="Date (Oldest)">Oldest</option>
                            <option value="Size (Largest)">Largest</option>
                            <option value="Size (Smallest)">Smallest</option>
                            <option value="Name (A-Z)">A-Z</option>
                            <option value="Name (Z-A)">Z-A</option>
                        </select>

                        <button onClick={() => setLayout(layout === 'grid' ? 'list' : 'grid')} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {layout === 'grid' ? <ListIcon size={18} /> : <LayoutGrid size={18} />}
                        </button>
                    </div>
                </div>

                {viewMode === 'active' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'var(--card-bg)', padding: '0.75rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                            {breadcrumbs.map((crumb, index) => (
                                <React.Fragment key={crumb._id || 'root'}>
                                    <span 
                                        onClick={() => handleBreadcrumbClick(index)}
                                        style={{ color: index === breadcrumbs.length - 1 ? 'var(--text-main)' : 'var(--primary)', cursor: 'pointer', fontWeight: index === breadcrumbs.length - 1 ? 600 : 400 }}
                                    >
                                        {crumb.name}
                                    </span>
                                    {index < breadcrumbs.length - 1 && <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
                                </React.Fragment>
                            ))}
                        </div>
                        <button onClick={handleCreateFolder} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                            <FolderPlus size={16} /> New Folder
                        </button>
                    </div>
                )}

                {viewMode === 'trash' && (
                    <div className="mb-4" style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                        <AlertCircle size={18} />
                        Files in the Recycle Bin will be permanently deleted after 30 days.
                    </div>
                )}

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="loader"></div>
                    </div>
                ) : (
                    <FileGrid
                        folders={viewMode === 'active' && !searchQuery ? folders : []}
                        files={getFilteredAndSortedFiles()}
                        viewMode={viewMode}
                        layout={layout}
                        onFolderClick={handleFolderClick}
                        onDownload={handleDownload}
                        onDelete={handleDelete}
                        onRestore={handleRestore}
                        onPermanentDelete={handlePermanentDelete}
                        onFileClick={(file) => setSelectedFile(file)}
                    />
                )}
            </div>
            
            {selectedFile && (
                <FilePreviewModal file={selectedFile} onClose={() => setSelectedFile(null)} />
            )}
        </div>
    );
};

export default Dashboard;
