import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { UploadCloud, FileText, Image, Map, Eye, Download, Trash2, X, File, AlertTriangle } from 'lucide-react';

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' +
           d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function getFileIcon(type) {
    if (!type) return <File size={20} />;
    if (type === 'application/pdf') return <FileText size={20} />;
    if (type.startsWith('image/svg')) return <Map size={20} />;
    if (type.startsWith('image/')) return <Image size={20} />;
    return <File size={20} />;
}

function getFileCategory(type) {
    if (!type) return 'File';
    if (type === 'application/pdf') return 'PDF';
    if (type.startsWith('image/svg')) return 'SVG';
    if (type.startsWith('image/')) return 'Image';
    return 'File';
}

function getFileUrl(storedName) {
    return `/uploads/blueprints/${storedName}`;
}

const Blueprint = () => {
    const [blueprints, setBlueprints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dragOver, setDragOver] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const fileInputRef = useRef(null);
    const showToast = useToast();

    useEffect(() => { loadBlueprints(); }, []);

    const loadBlueprints = async () => {
        try { setBlueprints(await api.getBlueprints()); }
        catch { showToast('⚠️ Could not load blueprints'); }
        finally { setLoading(false); }
    };

    const handleUpload = useCallback(async (file) => {
        if (!file) return;

        // Validate file type
        const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp', 'image/gif'];
        if (!allowed.includes(file.type)) {
            showToast('⚠️ Invalid file type. Use PDF, JPG, PNG, SVG, or WebP.');
            return;
        }
        // Validate file size (25MB)
        if (file.size > 25 * 1024 * 1024) {
            showToast('⚠️ File too large. Maximum size is 25MB.');
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        // Simulate progress for UX (actual upload is a single request)
        const progressInterval = setInterval(() => {
            setUploadProgress(p => {
                if (p >= 90) { clearInterval(progressInterval); return 90; }
                return p + Math.random() * 15;
            });
        }, 200);

        try {
            await api.uploadBlueprint(file);
            clearInterval(progressInterval);
            setUploadProgress(100);
            showToast('✅ Blueprint uploaded successfully');
            setTimeout(() => {
                setUploading(false);
                setUploadProgress(0);
                loadBlueprints();
            }, 500);
        } catch (err) {
            clearInterval(progressInterval);
            setUploading(false);
            setUploadProgress(0);
            showToast(`⚠️ ${err.message}`);
        }
    }, [showToast]);

    const handleDelete = async (id) => {
        try {
            await api.deleteBlueprint(id);
            showToast('✅ Blueprint deleted');
            setConfirmDelete(null);
            loadBlueprints();
        } catch { showToast('⚠️ Delete failed'); }
    };

    const onDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer?.files?.[0];
        if (file) handleUpload(file);
    }, [handleUpload]);

    const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
    const onDragLeave = () => setDragOver(false);

    return (
        <>
            {/* Hero Banner */}
            <div className="page-hero">
                <div>
                    <h2>Digital Infrastructure Maps</h2>
                    <p>Upload and manage campus blueprints, floor plans, and architecture documents.</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>
                        {blueprints.length} file{blueprints.length !== 1 ? 's' : ''} uploaded
                    </span>
                </div>
            </div>

            {/* Upload Drop Zone */}
            <div
                className={`bp-drop-zone ${dragOver ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => !uploading && fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".pdf,.jpg,.jpeg,.png,.svg,.webp,.gif"
                    onChange={(e) => {
                        if (e.target.files[0]) handleUpload(e.target.files[0]);
                        e.target.value = '';
                    }}
                />

                {uploading ? (
                    <div className="bp-upload-progress">
                        <div className="bp-progress-icon">
                            <UploadCloud size={28} />
                        </div>
                        <div className="bp-progress-info">
                            <span style={{ fontWeight: 700, fontSize: 14 }}>Uploading...</span>
                            <div className="bp-progress-bar">
                                <div className="bp-progress-fill" style={{ width: `${uploadProgress}%` }} />
                            </div>
                            <span style={{ fontSize: 12, color: 'var(--secondary-text)' }}>{Math.round(uploadProgress)}%</span>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="bp-drop-icon">
                            <UploadCloud size={36} />
                        </div>
                        <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
                            {dragOver ? 'Drop file here' : 'Upload Campus Blueprints'}
                        </h3>
                        <p style={{ color: 'var(--secondary-text)', fontSize: 13, marginBottom: 18 }}>
                            Drag & drop PDF, images, or maps — or click to browse
                        </p>
                        <button className="btn-primary" type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                            Browse Files
                        </button>
                        <p style={{ color: '#94A3B8', fontSize: 11, marginTop: 12 }}>Maximum file size: 25MB</p>
                    </>
                )}
            </div>

            {/* File Grid */}
            {loading ? (
                <div className="empty-state"><p>Loading blueprints…</p></div>
            ) : blueprints.length === 0 ? (
                <div className="empty-state">
                    <Map size={40} style={{ opacity: .15, marginBottom: 8 }} />
                    <p>No blueprints uploaded yet.</p>
                </div>
            ) : (
                <div className="bp-file-grid">
                    {blueprints.map((bp, i) => {
                        const isImage = bp.file_type?.startsWith('image/');
                        const url = getFileUrl(bp.stored_name);

                        return (
                            <div className="bp-file-card" key={bp.id} style={{ animationDelay: `${i * 0.05}s` }}>
                                {/* Thumbnail / Icon */}
                                <div className="bp-file-thumb" onClick={() => setPreviewFile(bp)}>
                                    {isImage ? (
                                        <img src={url} alt={bp.original_name} loading="lazy" />
                                    ) : (
                                        <div className="bp-file-icon-big">
                                            {getFileIcon(bp.file_type)}
                                            <span>{getFileCategory(bp.file_type)}</span>
                                        </div>
                                    )}
                                    <div className="bp-thumb-overlay">
                                        <Eye size={20} />
                                    </div>
                                </div>

                                {/* File Info */}
                                <div className="bp-file-info">
                                    <div className="bp-file-name" title={bp.original_name}>
                                        {bp.original_name}
                                    </div>
                                    <div className="bp-file-meta">
                                        <span className="bp-type-badge">{getFileCategory(bp.file_type)}</span>
                                        <span>{formatFileSize(bp.file_size)}</span>
                                        <span>•</span>
                                        <span>{formatDate(bp.created_at)}</span>
                                    </div>
                                    <div className="bp-file-uploader">
                                        Uploaded by <strong>{bp.uploaded_by || 'Admin'}</strong>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="bp-file-actions">
                                    <button className="bp-action-btn bp-view" title="Preview" onClick={() => setPreviewFile(bp)}>
                                        <Eye size={16} />
                                    </button>
                                    <a className="bp-action-btn bp-download" title="Download" href={url} download={bp.original_name} onClick={e => e.stopPropagation()}>
                                        <Download size={16} />
                                    </a>
                                    <button className="bp-action-btn bp-delete" title="Delete" onClick={() => setConfirmDelete(bp)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Preview Modal */}
            {previewFile && (
                <div className="modal-overlay" onClick={() => setPreviewFile(null)}>
                    <div className="bp-preview-modal" onClick={e => e.stopPropagation()}>
                        <div className="bp-preview-header">
                            <div>
                                <h3 style={{ fontWeight: 800, fontSize: 16, margin: 0 }}>{previewFile.original_name}</h3>
                                <span style={{ fontSize: 12, color: 'var(--secondary-text)' }}>
                                    {getFileCategory(previewFile.file_type)} • {formatFileSize(previewFile.file_size)}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                <a className="btn-primary" href={getFileUrl(previewFile.stored_name)} download={previewFile.original_name} style={{ fontSize: 12, padding: '8px 16px' }}>
                                    <Download size={14} /> Download
                                </a>
                                <X size={22} style={{ cursor: 'pointer', color: '#94A3B8' }} onClick={() => setPreviewFile(null)} />
                            </div>
                        </div>
                        <div className="bp-preview-body">
                            {previewFile.file_type === 'application/pdf' ? (
                                <iframe
                                    src={getFileUrl(previewFile.stored_name)}
                                    title={previewFile.original_name}
                                    style={{ width: '100%', height: '100%', border: 'none', borderRadius: 10 }}
                                />
                            ) : previewFile.file_type?.startsWith('image/') ? (
                                <img
                                    src={getFileUrl(previewFile.stored_name)}
                                    alt={previewFile.original_name}
                                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 10 }}
                                />
                            ) : (
                                <div className="empty-state">
                                    <p>Preview not available for this file type.</p>
                                    <a className="btn-primary" href={getFileUrl(previewFile.stored_name)} download style={{ marginTop: 16 }}>
                                        <Download size={14} /> Download File
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {confirmDelete && (
                <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, textAlign: 'center' }}>
                        <div style={{ marginBottom: 18 }}>
                            <div className="icon-circle color-red" style={{ margin: '0 auto 14px', width: 50, height: 50 }}>
                                <AlertTriangle size={22} />
                            </div>
                            <h3 style={{ fontWeight: 800, fontSize: 17, marginBottom: 6 }}>Delete Blueprint?</h3>
                            <p style={{ fontSize: 13, color: 'var(--secondary-text)', lineHeight: 1.6 }}>
                                Are you sure you want to delete <strong>"{confirmDelete.original_name}"</strong>? This action cannot be undone.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                            <button className="btn-secondary" onClick={() => setConfirmDelete(null)} style={{ padding: '10px 22px' }}>Cancel</button>
                            <button className="btn-danger" onClick={() => handleDelete(confirmDelete.id)} style={{ padding: '10px 22px' }}>
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Blueprint;
